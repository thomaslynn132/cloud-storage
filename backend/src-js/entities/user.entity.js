import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { File } from './file.entity';
import { Payment } from './payment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 'free' })
  planType: 'free' | 'paid';

  @Column({ default: 0 })
  storageUsed: number;

  @Column({ nullable: true })
  subscriptionExpiresAt: Date;

  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => File, (file) => file.user)
  files: File[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];
}
