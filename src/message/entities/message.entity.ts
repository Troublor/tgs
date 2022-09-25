import {
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import User from '../../database/entities/User.entity.js';

@Entity()
export default class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'timestamp' })
  sentAt!: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinTable()
  receiver!: Relation<User>;

  @BeforeInsert()
  beforeInsert() {
    this.sentAt = new Date();
  }

  get jsonObject(): Record<string, unknown> {
    return {
      content: this.content,
      sentAt: this.sentAt.toString(),
      receivers: this.receiver.name || this.receiver.username,
    };
  }
}
