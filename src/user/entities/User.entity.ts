import { Entity, PrimaryColumn } from 'typeorm';

@Entity()
export default class User {
  @PrimaryColumn({ type: String })
  username!: string;
}
