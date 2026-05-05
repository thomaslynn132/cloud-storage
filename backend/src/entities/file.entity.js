const { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, Index } = require('typeorm');

@Entity('files')
@Index(['hash'])
@Index(['expiryDate'])
class File {
  @PrimaryGeneratedColumn('uuid')
  id;

  @ManyToOne('User', 'files')
  user;

  @Column()
  userId;

  @Column()
  fileName;

  @Column()
  size;

  @Column()
  hash;

  @Column()
  storageKey;

  @Column({ default: false })
  isPermanent;

  @Column({ nullable: true })
  expiryDate;

  @Column({ default: 0 })
  downloadCount;

  @Column({ default: false })
  isDeleted;

  @CreateDateColumn()
  createdAt;

  @OneToMany('Download', 'file')
  downloads;
}

module.exports = { File };
