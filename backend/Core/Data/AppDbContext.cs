using Core.Models;
using Microsoft.EntityFrameworkCore;

namespace Core.Data
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

        public virtual DbSet<Resettlement> Resettlements { get; set; } = null!;

        public virtual DbSet<ExpendableEquipment> ExpendableEquipments { get; set; } = null!;

        public virtual DbSet<ExpendableType> ExpendableTypes { get; set; } = null!;

        public virtual DbSet<ExpendableDistribution> ExpendableDistributions { get; set; } = null!;

        public virtual DbSet<StationaryEquipment> StationaryEquipments { get; set; } = null!;

        public virtual DbSet<StationaryType> StationaryTypes { get; set; } = null!;

        public virtual DbSet<Status> Statuses { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Building>(entity =>
            {
                entity.ToTable("building");

                entity.Property(e => e.Address).HasMaxLength(300);
                entity.Property(e => e.Latitude).HasColumnType("decimal(9, 6)");
                entity.Property(e => e.Longitude).HasColumnType("decimal(9, 6)");
                entity.Property(e => e.Name).HasMaxLength(100);
            });

            modelBuilder.Entity<Contact>(entity =>
            {
                entity.ToTable("contact");

                entity.Property(e => e.Comment).HasMaxLength(300);
                entity.Property(e => e.Phone)
                    .HasMaxLength(15)
                    .IsUnicode(false);

                entity.HasOne(d => d.Student).WithMany(p => p.Contacts)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientCascade)
                    .HasConstraintName("FK_Contact_Student");
            });

            modelBuilder.Entity<Group>(entity =>
            {
                entity.ToTable("group");

                entity.Property(e => e.Name).HasMaxLength(20);
            });

            modelBuilder.Entity<Note>(entity =>
            {
                entity.ToTable("note");

                entity.Property(e => e.Text).HasMaxLength(500);

                entity.HasOne(d => d.Student).WithMany(p => p.Notes)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientCascade)
                    .HasConstraintName("FK_Note_Student");

                entity.HasOne(d => d.User).WithMany(p => p.Notes)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.SetNull)
                    .HasConstraintName("FK_Note_User");
            });

            modelBuilder.Entity<Resettlement>(entity =>
            {
                entity.ToTable("resettlement");

                entity.HasOne(d => d.Room).WithMany(p => p.Resettlements)
                    .HasForeignKey(d => d.RoomId)
                    .HasConstraintName("FK_Resettlement_Room");

                entity.HasOne(d => d.Student).WithMany(p => p.Resettlements)
                    .HasForeignKey(d => d.StudentId)
                    .HasConstraintName("FK_Resettlement_Student");
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("role");

                entity.Property(e => e.Name)
                    .HasMaxLength(13)
                    .HasDefaultValue("Воспитатель");
            });

            modelBuilder.Entity<Room>(entity =>
            {
                entity.ToTable("room");

                entity.HasOne(d => d.Building).WithMany(p => p.Rooms)
                    .HasForeignKey(d => d.BuildingId)
                    .HasConstraintName("FK_Room_Building");
            });

            modelBuilder.Entity<Student>(entity =>
            {
                entity.ToTable("student");

                entity.Property(e => e.Image).IsUnicode(false);
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
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("user");

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

            modelBuilder.Entity<ExpendableDistribution>(entity =>
            {
                entity.ToTable("expendable_distribution");

                entity.HasOne(d => d.Expendable).WithMany(p => p.ExpendableDistributions)
                    .HasForeignKey(d => d.ExpendableId)
                    .OnDelete(DeleteBehavior.ClientCascade)
                    .HasConstraintName("FK_ExpendableDistribution_ExpendableEquipment");

                entity.HasOne(d => d.Student).WithMany(p => p.ExpendableDistributions)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientCascade)
                    .HasConstraintName("FK_ExpendableDistribution_Student");
            });

            modelBuilder.Entity<ExpendableEquipment>(entity =>
            {
                entity.ToTable("expendable_equipment");

                entity.HasOne(d => d.Type).WithMany(p => p.ExpendableEquipments)
                    .HasForeignKey(d => d.TypeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_ExpendableEquipment_ExpendableType");
            });

            modelBuilder.Entity<ExpendableType>(entity =>
            {
                entity.ToTable("expendable_type");

                entity.Property(e => e.Name).HasMaxLength(100);
            });

            modelBuilder.Entity<StationaryEquipment>(entity =>
            {
                entity.ToTable("stationary_equipment");

                entity.Property(e => e.Description).HasMaxLength(300);
                entity.Property(e => e.InventoryNumber).HasMaxLength(6);

                entity.HasOne(d => d.Room).WithMany(p => p.StationaryEquipments)
                    .HasForeignKey(d => d.RoomId)
                    .HasConstraintName("FK_Equipment_Room");

                entity.HasOne(d => d.Status).WithMany(p => p.StationaryEquipments)
                    .HasForeignKey(d => d.StatusId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Equipment_Status");

                entity.HasOne(d => d.Type).WithMany(p => p.StationaryEquipments)
                    .HasForeignKey(d => d.TypeId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Equipment_Type");
            });

            modelBuilder.Entity<StationaryType>(entity =>
            {
                entity.HasKey(e => e.Id).HasName("PK_Type");

                entity.ToTable("stationary_type");

                entity.Property(e => e.Name).HasMaxLength(100);
            });

            modelBuilder.Entity<Status>(entity =>
            {
                entity.ToTable("status");

                entity.Property(e => e.Name).HasMaxLength(9);
            });

            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Администратор" },
                new Role { Id = 2, Name = "Комендант" },
                new Role { Id = 3, Name = "Воспитатель" }
            );

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
