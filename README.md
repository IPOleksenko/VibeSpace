<table>
  <tr>
    <td><img src="frontend/src/logo.svg" width="256" alt="logo"></td>
        <td>
            <h1 style="font-size: 64px;">VibeSpace</h1>
        </td>
  </tr>
</table>

## 📌 Setup Instructions

### 🔧 Fill Environment Files
Ensure all required environment files are present in `backend/env/` before proceeding.

### 📦 Install Dependencies
To install all necessary dependencies in a virtual environment, run:

```sh
py install.py
```

### 🔄 Migrate Database
Run database migrations using:

```sh
py migrate.py
```

### 🚀 Start the Project
To start the backend server, execute:

```sh
py run.py
```

## 📁 Git Ignore Environment Files
Prevent changes to sensitive environment files from being tracked:

```sh
git update-index --assume-unchanged backend/.env
git update-index --assume-unchanged frontend/.env
```

### 🔄 Restore Change Tracking
If you need to track changes again:

```sh
git update-index --no-assume-unchanged backend/.env
git update-index --no-assume-unchanged frontend/.env
```

## ✍️ Authors

- [IPOleksenko](https://github.com/IPOleksenko) (Owner)

## 📜 License

This project is licensed under the [MIT License](./LICENSE).
