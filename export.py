import pandas as pd
import mysql.connector
from sqlalchemy import create_engine

# Database connection parameters
db_config = {
    'user': 'root',    # replace 'your_username' with your MySQL username
    'password': 'Tatya313912',  # replace 'your_password' with your MySQL password
    'host': 'localhost',        # or your MySQL host, e.g., '127.0.0.1'
    'database': 'shorthandexam2024'  # your database name
}

# Creating a connection string for SQLAlchemy engine
connection_string = f"mysql+mysqlconnector://{db_config['user']}:{db_config['password']}@{db_config['host']}/{db_config['database']}"

# Connecting to the database using SQLAlchemy engine
engine = create_engine(connection_string)

# Establishing a connection using mysql.connector for executing SQL commands
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# SQL command to fetch all table names in the database
cursor.execute("SHOW TABLES")
tables = cursor.fetchall()

# Loop over each table name
for (table_name,) in tables:
    # Query to select all data from the table
    query = f"SELECT * FROM `{table_name}`"
    # Using pandas to load data directly from the database into DataFrame
    df = pd.read_sql(query, con=engine)
    # Exporting DataFrame to CSV, setting index=False to avoid additional index column
    df.to_csv(f"{table_name}.csv", index=False)
    print(f"Exported {table_name}")

# Closing cursor and connection
cursor.close()
conn.close()