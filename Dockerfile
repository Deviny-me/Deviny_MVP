FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . ./

RUN dotnet restore ./backend/src/Deviny.API/Deviny.API.csproj
RUN dotnet publish ./backend/src/Deviny.API/Deviny.API.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/out ./
RUN mkdir -p /app/uploads

EXPOSE 8080
ENTRYPOINT ["dotnet", "Deviny.API.dll"]