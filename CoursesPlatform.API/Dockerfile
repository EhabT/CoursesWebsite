# ──────────────────────────────────────────────────
# Multi-stage Dockerfile for CoursesPlatform .NET API
# ──────────────────────────────────────────────────

# Stage 1: Base runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Stage 2: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CoursesPlatform.API/CoursesPlatform.API.csproj", "CoursesPlatform.API/"]
RUN dotnet restore "CoursesPlatform.API/CoursesPlatform.API.csproj"
COPY . .
WORKDIR "/src/CoursesPlatform.API"
RUN dotnet build -c Release -o /app/build

# Stage 3: Publish
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Stage 4: Final runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "CoursesPlatform.API.dll"]
