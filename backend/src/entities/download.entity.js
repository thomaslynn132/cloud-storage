const { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } = require('typeorm');

@Entity('downloads')
@Index(['fileId'])
class Download {
  @PrimaryGeneratedColumn('uuid')
  id;

  @ManyToOne('File', 'downloads')
  file;

  @Column()
  fileId;

  @Column()
  ipAddress;

  @Column({ default: false })
  adShown;

  @Column({ default: false })
  adClicked;

  @CreateDateColumn()
  createdAt;
}

module.exports = { Download };
