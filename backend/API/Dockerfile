
# API runtime container
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution projects to restore dependencies
COPY backend/API/API.csproj backend/API/
COPY backend/Core/Core.csproj backend/Core/
RUN dotnet restore backend/API/API.csproj

# Copy the entire backend source and publish
COPY backend/ backend/
RUN dotnet publish backend/API/API.csproj -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "API.dll"]
