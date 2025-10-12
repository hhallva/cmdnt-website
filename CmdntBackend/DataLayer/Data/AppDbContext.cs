using DataLayer.Models;
using Microsoft.EntityFrameworkCore;

namespace DataLayer.Data
{
    public partial class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        public virtual DbSet<Contact> Contacts { get; set; } = null!;

        public virtual DbSet<Group> Groups { get; set; } = null!;

        public virtual DbSet<Note> Notes { get; set; } = null!;

        public virtual DbSet<Role> Roles { get; set; } = null!;

        public virtual DbSet<Room> Rooms { get; set; } = null!;

        public virtual DbSet<Student> Students { get; set; } = null!;

        public virtual DbSet<User> Users { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Contact>(entity =>
            {
                entity.ToTable("Contact");

                entity.Property(e => e.Comment).HasMaxLength(300);
                entity.Property(e => e.Phone)
                    .HasMaxLength(15)
                    .IsUnicode(false);

                entity.HasOne(d => d.Student).WithMany(p => p.Contacts)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Contact_Student");
            });

            modelBuilder.Entity<Group>(entity =>
            {
                entity.ToTable("Group");

                entity.Property(e => e.Name).HasMaxLength(20);
            });

            modelBuilder.Entity<Note>(entity =>
            {
                entity.ToTable("Note");

                entity.Property(e => e.CreateDate);
                entity.Property(e => e.Text).HasMaxLength(500);

                entity.HasOne(d => d.Student).WithMany(p => p.Notes)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Note_Student");

                entity.HasOne(d => d.User).WithMany(p => p.Notes)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Note_User");
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Role");

                entity.Property(e => e.Name)
                    .HasMaxLength(13)
                    .HasDefaultValue("Воспитатель");
            });

            modelBuilder.Entity<Room>(entity =>
            {
                entity.ToTable("Room");

                entity.Property(e => e.RoomNumber).HasColumnName("Room");
            });

            modelBuilder.Entity<Student>(entity =>
            {
                entity.ToTable("Student");

                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Origin).HasMaxLength(300);
                entity.Property(e => e.Patronymic).HasMaxLength(100);
                entity.Property(e => e.Phone)
                    .HasMaxLength(15)
                    .IsUnicode(false);
                entity.Property(e => e.Surname).HasMaxLength(100);

                entity.HasOne(d => d.Group).WithMany(p => p.Students)
                    .HasForeignKey(d => d.GroupId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Student_Group");

                entity.HasMany(d => d.Rooms).WithMany(p => p.Students)
                    .UsingEntity<Dictionary<string, object>>(
                        "Resettlement",
                        r => r.HasOne<Room>().WithMany()
                            .HasForeignKey("RoomId")
                            .OnDelete(DeleteBehavior.ClientSetNull)
                            .HasConstraintName("FK_Resettlement_Room"),
                        l => l.HasOne<Student>().WithMany()
                            .HasForeignKey("StudentId")
                            .OnDelete(DeleteBehavior.ClientSetNull)
                            .HasConstraintName("FK_Resettlement_Student"),
                        j =>
                        {
                            j.HasKey("StudentId", "RoomId");
                            j.ToTable("Resettlement");
                        });
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("User");

                entity.Property(e => e.HashPassword)
                    .HasMaxLength(255)
                    .IsUnicode(false);
                entity.Property(e => e.Login).HasMaxLength(100);
                entity.Property(e => e.Name).HasMaxLength(100);
                entity.Property(e => e.Patronymic).HasMaxLength(100);
                entity.Property(e => e.Surname).HasMaxLength(100);

                entity.HasOne(d => d.Role).WithMany(p => p.Users)
                    .HasForeignKey(d => d.RoleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_User_Role");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}