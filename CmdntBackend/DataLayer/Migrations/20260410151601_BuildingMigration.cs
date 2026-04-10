using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DataLayer.Migrations
{
    /// <inheritdoc />
    public partial class BuildingMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.AddColumn<int>(
                name: "BuildingId",
                table: "Room",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Building",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "varchar(300)", maxLength: 300, nullable: false),
                    Latitude = table.Column<decimal>(type: "decimal(9,6)", nullable: false),
                    Longitude = table.Column<decimal>(type: "decimal(9,6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Building", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Distribution",
                columns: table => new
                {
                    BuildingId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Distribution", x => new { x.BuildingId, x.UserId });
                    table.ForeignKey(
                        name: "FK_Distribution_Building",
                        column: x => x.BuildingId,
                        principalTable: "Building",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Distribution_User",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "ИСПВ-21");

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Course", "Name" },
                values: new object[] { 4, "ИСПВ-22" });

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Course", "Name" },
                values: new object[] { 3, "ИСПВ-32" });

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Course", "Name" },
                values: new object[] { 2, "ИСПВ-42" });

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Course", "Name" },
                values: new object[] { 1, "ИСПВ-52" });

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Course", "Name" },
                values: new object[] { 4, "ИСПП-21" });

            migrationBuilder.InsertData(
                table: "Group",
                columns: new[] { "Id", "Course", "Name" },
                values: new object[,]
                {
                    { 7, 3, "ИСПП-31" },
                    { 8, 3, "ИСПП-34" },
                    { 9, 3, "ИСПП-35" },
                    { 10, 2, "ИСПП-41" },
                    { 11, 2, "ИСПП-43" },
                    { 12, 2, "ИСПП-45" },
                    { 13, 1, "ИСПП-51" },
                    { 14, 1, "ИСПП-55" },
                    { 15, 5, "ИСС-11" },
                    { 16, 5, "ИСС-12" },
                    { 17, 4, "ИСС-21" },
                    { 18, 4, "ИСС-22" },
                    { 19, 4, "ИСС-25" },
                    { 20, 3, "ИСС-31" },
                    { 21, 3, "ИСС-32" },
                    { 22, 3, "ИСС-35" },
                    { 23, 2, "ИСС-41" },
                    { 24, 2, "ИСС-45" },
                    { 25, 1, "ИСС-51" },
                    { 26, 1, "ИСС-52" },
                    { 27, 4, "КСК-21" },
                    { 28, 4, "КСК-22" },
                    { 29, 3, "КСК-31" },
                    { 30, 2, "КСК-41" },
                    { 31, 1, "КСК-51" },
                    { 32, 4, "ОИБ-21" },
                    { 33, 3, "ОИБ-31" },
                    { 34, 3, "ОИБ-35" },
                    { 35, 2, "ОИБ-41" },
                    { 36, 1, "ОИБ-51" },
                    { 37, 2, "П-41" },
                    { 38, 4, "Р-21" },
                    { 39, 3, "РМТ-31" },
                    { 40, 3, "РМТ-35" },
                    { 41, 2, "РМТ-41" },
                    { 42, 2, "РМТ-45" },
                    { 43, 1, "РМТ-51" },
                    { 44, 1, "РМТ-52" },
                    { 45, 4, "ССА-21" },
                    { 46, 4, "ССА-22" },
                    { 47, 3, "ССА-31" },
                    { 48, 3, "ССА-35" },
                    { 49, 2, "ССА-41" },
                    { 50, 1, "ССА-51" },
                    { 51, 1, "ССА-55" }
                });

            migrationBuilder.InsertData(
                table: "User",
                columns: new[] { "Id", "HashPassword", "Login", "Name", "Patronymic", "RoleId", "Surname" },
                values: new object[] { 1000, "$2a$11$d8vF3IhihB1tqrQJBD.0FOqi43KZx6OLTMZ49b5DyK.i7yLOa.P", "superadmin", "Админ", "Админович", 1, "Админов" });

            migrationBuilder.CreateIndex(
                name: "IX_Room_BuildingId",
                table: "Room",
                column: "BuildingId");

            migrationBuilder.CreateIndex(
                name: "IX_Distribution_UserId",
                table: "Distribution",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Room_Building",
                table: "Room",
                column: "BuildingId",
                principalTable: "Building",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Room_Building",
                table: "Room");

            migrationBuilder.DropTable(
                name: "Distribution");

            migrationBuilder.DropTable(
                name: "Building");

            migrationBuilder.DropIndex(
                name: "IX_Room_BuildingId",
                table: "Room");

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 39);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 50);

            migrationBuilder.DeleteData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 51);

            migrationBuilder.DeleteData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1000);

            migrationBuilder.DropColumn(
                name: "BuildingId",
                table: "Room");

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "ИСПП-21");

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Course", "Name" },
                values: new object[] { 2, "ОИБ-41" });

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Course", "Name" },
                values: new object[] { 2, "ИСПВ-42" });

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Course", "Name" },
                values: new object[] { 3, "ИСПВ-21" });

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Course", "Name" },
                values: new object[] { 4, "ИСПВ-22" });

            migrationBuilder.UpdateData(
                table: "Group",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Course", "Name" },
                values: new object[] { 2, "ССА-41" });

            migrationBuilder.InsertData(
                table: "User",
                columns: new[] { "Id", "HashPassword", "Login", "Name", "Patronymic", "RoleId", "Surname" },
                values: new object[,]
                {
                    { 1, "$2a$11$BvKICMIl2hQnMvmn4wai3OQYG71RDX5DBDBS3dltpJkxhCWFalKhC", "admin", "Елена", "Сергеевна", 1, "Нестерова" },
                    { 2, "$2a$11$1S9ZmtoRpjbgte.mXxyu2./mf1yjXvr4Yot0cM0c2pq.9Xz.SXYqS", "cmdnt", "Нина", "Альбертовна", 2, "Чупова" },
                    { 3, "$2a$11$rG4.DIBr4/gtvIxvk6FBGeTlUM.9G.ug0lqs.C7T5TtcsXg1kjqwi", "vospit", "Ольга", "Вячелсавовна", 3, "Едакина" }
                });
        }
    }
}
