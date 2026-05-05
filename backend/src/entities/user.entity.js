const { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index } = require('typeorm');

@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid')
  id;

  @Column({ unique: true })
  email;

  @Column()
  passwordHash;

  @Column({ default: 'free' })
  planType;

  @Column({ default: 0 })
  storageUsed;

  @Column({ nullable: true })
  subscriptionExpiresAt;

  @Column({ default: false })
  isAdmin;

  @CreateDateColumn()
  createdAt;

  @OneToMany('File', 'user')
  files;

  @OneToMany('Payment', 'user')
  payments;
}

module.exports = { User };
