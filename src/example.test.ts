import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  isActive: boolean;

  @OneToMany(() => Account, (account) => account.user)
  accounts = new Collection<Account>(this);

  constructor(isActive: boolean) {
    this.isActive = isActive;
  }

}

@Entity()
class Account {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User, { nullable: true, eager: true })
  user!: User | null;

  @Property({ persist: false })
  isActive?: boolean = true;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Account],
    debug: true,
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const user = orm.em.create(User, { isActive: true });
  orm.em.create(Account, { user: user });
  await orm.em.flush();
  orm.em.clear();

  // This line should probably raise a typescript error
  // But even though it doesn't the filter should still be scoped to the Account entity
  const inactiveAccounts = await orm.em.find(Account, { isActive: false });
  expect(inactiveAccounts.length).toBe(1);
  expect(inactiveAccounts[0].user?.isActive).toBe(true);

});
