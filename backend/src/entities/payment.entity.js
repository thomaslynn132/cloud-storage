const { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } = require('typeorm');

@Entity('payments')
@Index(['userId'])
class Payment {
  @PrimaryGeneratedColumn('uuid')
  id;

  @ManyToOne('User', 'payments')
  user;

  @Column()
  userId;

  @Column()
  amount;

  @Column()
  plan;

  @Column()
  stripeSubscriptionId;

  @Column()
  expiresAt;

  @Column({ default: 'active' })
  status;

  @CreateDateColumn()
  createdAt;
}

module.exports = { Payment };
