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

        public virtual DbSet<Building> Buildings { get; set; } = null!;

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
                    .OnDelete(DeleteBehavior.SetNull)
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
                entity.HasOne(d => d.Building).WithMany(p => p.Rooms)
                    .HasForeignKey(d => d.BuildingId)
                    .HasConstraintName("FK_Room_Building");
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
                            .OnDelete(DeleteBehavior.Cascade)
                            .HasConstraintName("FK_Resettlement_Room"),
                        l => l.HasOne<Student>().WithMany()
                            .HasForeignKey("StudentId")
                            .OnDelete(DeleteBehavior.Cascade)
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

            modelBuilder.Entity<Building>(entity =>
            {
                entity.ToTable("Building");

                entity.Property(e => e.Address).HasMaxLength(300);
                entity.Property(e => e.Latitude).HasColumnType("decimal(9, 6)");
                entity.Property(e => e.Longitude).HasColumnType("decimal(9, 6)");
                entity.Property(e => e.Name).HasMaxLength(100);

                entity.HasMany(d => d.Users).WithMany(p => p.Buildings)
                    .UsingEntity<Dictionary<string, object>>(
                        "Distribution",
                        r => r.HasOne<User>().WithMany()
                            .HasForeignKey("UserId")
                            .HasConstraintName("FK_Distribution_User"),
                        l => l.HasOne<Building>().WithMany()
                            .HasForeignKey("BuildingId")
                            .HasConstraintName("FK_Distribution_Building"),
                        j =>
                        {
                            j.HasKey("BuildingId", "UserId");
                            j.ToTable("Distribution");
                        });
            });

            modelBuilder.Entity<Group>().HasData(
                new Group { Id = 1, Name = "ИСПВ-21", Course = 4 },
                new Group { Id = 2, Name = "ИСПВ-22", Course = 4 },
                new Group { Id = 3, Name = "ИСПВ-32", Course = 3 },
                new Group { Id = 4, Name = "ИСПВ-42", Course = 2 },
                new Group { Id = 5, Name = "ИСПВ-52", Course = 1 },
                new Group { Id = 6, Name = "ИСПП-21", Course = 4 },
                new Group { Id = 7, Name = "ИСПП-31", Course = 3 },
                new Group { Id = 8, Name = "ИСПП-34", Course = 3 },
                new Group { Id = 9, Name = "ИСПП-35", Course = 3 },
                new Group { Id = 10, Name = "ИСПП-41", Course = 2 },
                new Group { Id = 11, Name = "ИСПП-43", Course = 2 },
                new Group { Id = 12, Name = "ИСПП-45", Course = 2 },
                new Group { Id = 13, Name = "ИСПП-51", Course = 1 },
                new Group { Id = 14, Name = "ИСПП-55", Course = 1 },
                new Group { Id = 15, Name = "ИСС-11", Course = 5 },
                new Group { Id = 16, Name = "ИСС-12", Course = 5 },
                new Group { Id = 17, Name = "ИСС-21", Course = 4 },
                new Group { Id = 18, Name = "ИСС-22", Course = 4 },
                new Group { Id = 19, Name = "ИСС-25", Course = 4 },
                new Group { Id = 20, Name = "ИСС-31", Course = 3 },
                new Group { Id = 21, Name = "ИСС-32", Course = 3 },
                new Group { Id = 22, Name = "ИСС-35", Course = 3 },
                new Group { Id = 23, Name = "ИСС-41", Course = 2 },
                new Group { Id = 24, Name = "ИСС-45", Course = 2 },
                new Group { Id = 25, Name = "ИСС-51", Course = 1 },
                new Group { Id = 26, Name = "ИСС-52", Course = 1 },
                new Group { Id = 27, Name = "КСК-21", Course = 4 },
                new Group { Id = 28, Name = "КСК-22", Course = 4 },
                new Group { Id = 29, Name = "КСК-31", Course = 3 },
                new Group { Id = 30, Name = "КСК-41", Course = 2 },
                new Group { Id = 31, Name = "КСК-51", Course = 1 },
                new Group { Id = 32, Name = "ОИБ-21", Course = 4 },
                new Group { Id = 33, Name = "ОИБ-31", Course = 3 },
                new Group { Id = 34, Name = "ОИБ-35", Course = 3 },
                new Group { Id = 35, Name = "ОИБ-41", Course = 2 },
                new Group { Id = 36, Name = "ОИБ-51", Course = 1 },
                new Group { Id = 37, Name = "П-41", Course = 2 },
                new Group { Id = 38, Name = "Р-21", Course = 4 },
                new Group { Id = 39, Name = "РМТ-31", Course = 3 },
                new Group { Id = 40, Name = "РМТ-35", Course = 3 },
                new Group { Id = 41, Name = "РМТ-41", Course = 2 },
                new Group { Id = 42, Name = "РМТ-45", Course = 2 },
                new Group { Id = 43, Name = "РМТ-51", Course = 1 },
                new Group { Id = 44, Name = "РМТ-52", Course = 1 },
                new Group { Id = 45, Name = "ССА-21", Course = 4 },
                new Group { Id = 46, Name = "ССА-22", Course = 4 },
                new Group { Id = 47, Name = "ССА-31", Course = 3 },
                new Group { Id = 48, Name = "ССА-35", Course = 3 },
                new Group { Id = 49, Name = "ССА-41", Course = 2 },
                new Group { Id = 50, Name = "ССА-51", Course = 1 },
                new Group { Id = 51, Name = "ССА-55", Course = 1 }
            );

            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Администратор" },
                new Role { Id = 2, Name = "Комендант" },
                new Role { Id = 3, Name = "Воспитатель" }
            );

            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1000,
                    Surname = "Админов",
                    Name = "Админ",
                    Patronymic = "Админович",
                    Login = "superadmin",
                    HashPassword = "$2a$11$d8vF3IhihB1tqrQJBD.0FOqi43KZx6OLTMZ49b5DyK.i7yLOa.P", //sdflndsfjdsfe12
                    RoleId = 1
                }
            );

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}