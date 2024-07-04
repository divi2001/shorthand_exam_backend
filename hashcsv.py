import os
import mysql.connector
import json
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from dotenv import load_dotenv
import base64
import csv

load_dotenv()

DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_DATABASE = os.getenv('DB_DATABASE')
SECRET_KEY = os.getenv('SECRET_KEY')

import hashlib

def ensure_key_length(key, desired_length=32):
    hasher = hashlib.sha256()
    hasher.update(key.encode())  # Ensure key is being hashed directly from the string
    return hasher.digest()[:desired_length]

def encrypt(obj):
    plain_text = json.dumps(obj)
    iv = os.urandom(16)  # Initialization vector for CBC mode

    # Ensure the key is of the correct length
    key = base64.b64decode(SECRET_KEY)
    key = ensure_key_length(SECRET_KEY)

    backend = default_backend()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=backend)
    encryptor = cipher.encryptor()

    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(plain_text.encode()) + padder.finalize()

    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()

    iv_hex = base64.b64encode(iv).decode('utf-8')
    encrypted_hex = base64.b64encode(encrypted_data).decode('utf-8')
    return f"{iv_hex}:{encrypted_hex}"

def decrypt(encrypted_text):
    parts = encrypted_text.split(':')
    if len(parts) != 2:
        raise ValueError('Invalid input format for decryption')

    iv_hex, encrypted_hex = parts
    iv = base64.b64decode(iv_hex)
    encrypted_data = base64.b64decode(encrypted_hex)

    # Ensure the key is of the correct length
    key = base64.b64decode(SECRET_KEY)
    key = ensure_key_length(key)

    backend = default_backend()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=backend)
    decryptor = cipher.decryptor()

    decrypted_data = decryptor.update(encrypted_data) + decryptor.finalize()
    unpadder = padding.PKCS7(128).unpadder()
    unpadded_data = unpadder.update(decrypted_data) + unpadder.finalize()

    decrypted_text = unpadded_data.decode('utf-8')
    try:
        return json.loads(decrypted_text)
    except json.JSONDecodeError:
        return decrypted_text

def upload_center_data(csv_file):
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_DATABASE
        )
        cursor = connection.cursor()

        # Read the CSV file and parse its contents
        with open(csv_file, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Encrypt the centerpass value
                encrypted_centerpass = encrypt(row['centerpass'])

                # Update the centerpass value in the row with the encrypted value
                row['centerpass'] = encrypted_centerpass

                # Insert the updated row into the MySQL database
                query = """
                    INSERT INTO examcenterdb (center, centerpass, center_name, center_address, pc_count, max_pc)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
                values = (
                    row['center'],
                    row['centerpass'],
                    row['center_name'],
                    row['center_address'],
                    row['pc_count'],
                    row['max_pc']
                )
                cursor.execute(query, values)

        connection.commit()
        print('Center data uploaded and encrypted successfully')
    except mysql.connector.Error as error:
        print('Error inserting center data:', error)
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

# Example usage
csv_file_path = 'finalstu - examcenterdb.csv'
upload_center_data(csv_file_path)