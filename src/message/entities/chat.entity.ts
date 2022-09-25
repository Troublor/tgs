import {
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryColumn,
  Relation,
} from 'typeorm';
import User from '../../database/entities/User.entity.js';

@Entity()
export default class Chat {
  @PrimaryColumn({ type: String })
  id!: string;

  @Column({ type: 'timestamp' })
  bindAt!: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinTable()
  user!: Relation<User>;

  @BeforeInsert()
  beforeInsert() {
    this.bindAt = new Date();
  }
}
