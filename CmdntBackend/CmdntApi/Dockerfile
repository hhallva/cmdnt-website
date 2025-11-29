
# CmdntAPI runtime container
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution projects to restore dependencies
COPY CmdntBackend/CmdntApi/CmdntApi.csproj CmdntBackend/CmdntApi/
COPY CmdntBackend/DataLayer/DataLayer.csproj CmdntBackend/DataLayer/
RUN dotnet restore CmdntBackend/CmdntApi/CmdntApi.csproj

# Copy the entire backend source and publish
COPY CmdntBackend/ CmdntBackend/
RUN dotnet publish CmdntBackend/CmdntApi/CmdntApi.csproj -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "CmdntApi.dll"]
