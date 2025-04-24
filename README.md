<table>
  <tr>
    <td><img src="frontend/src/logo.svg" width="256" alt="logo"></td>
        <td>
            <h1 style="font-size: 64px;">VibeSpace</h1>
        </td>
  </tr>
</table>

## 📌 Setup Instructions

### ⚡ Enable Redis and Configure `env/backend.env`.

Ensure Redis is running on your system and configure the necessary settings in `env/backend.env`.

### 🔧 Fill Environment Files

Ensure that all required environment variables are present in both `env/backend.env` and `env/frontend.env` files before proceeding.

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

### 🔐 Create Superuser

To automatically create a Django superuser, run the following script after applying migrations:

```sh
py create_superuser.py
```

This will create a superuser with:

- 👤 Username: `admin`  
- 📧 Email: `admin@gmail.com`  
- 🔑 Password: `admin`

You can also create a custom superuser by passing credentials in the format `username:password`:

```sh
py create_superuser.py username:password
```

This will use `username@gmail.com` as the email address.  
The script checks if the user already exists and only creates the superuser if necessary.

### 🚀 Start the Project

To start the backend server, execute:

```sh
py run.py
```

## 📁 Git Ignore Environment Files

Prevent changes to sensitive environment files from being tracked:

```sh
git update-index --assume-unchanged env/backend.env
git update-index --assume-unchanged env/frontend.env
```

### 🔄 Restore Change Tracking

If you need to track changes again:

```sh
git update-index --no-assume-unchanged env/backend.env
git update-index --no-assume-unchanged env/frontend.env
```

## ✍️ Authors

- [IPOleksenko](https://github.com/IPOleksenko) (Owner)

## 📜 License

This project is licensed under the [MIT License](./LICENSE).
