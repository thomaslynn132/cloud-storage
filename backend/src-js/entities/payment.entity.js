import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('payments')
@Index(['userId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.payments)
  user: User;

  @Column()
  userId: string;

  @Column()
  amount: number;

  @Column()
  plan: 'basic' | 'pro';

  @Column()
  stripeSubscriptionId: string;

  @Column()
  expiresAt: Date;

  @Column({ default: 'active' })
  status: 'active' | 'cancelled' | 'expired';

  @CreateDateColumn()
  createdAt: Date;
}
