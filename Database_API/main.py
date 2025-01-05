  # Import required modules
import dotenv
import os
import mysql.connector
from fastapi import FastAPI, HTTPException, UploadFile, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from mysql.connector import errorcode
import jwt
from pydantic import BaseModel
from typing import List

# Loading the environment variables
dotenv.load_dotenv()

# Initialize the todoapi app
app = FastAPI()

# Define the allowed origins for CORS
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to the MySQL database
try:
    cnx = mysql.connector.connect(
        user=os.environ['MYSQL_USER'],
        password=os.environ['MYSQL_PASSWORD'],
        host=os.environ['MYSQL_HOST'],
        database=os.environ['MYSQL_DB'],
    )

    cursor = cnx.cursor(buffered=True)
except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Something is wrong with your user name or password")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
    else:
        print(err)

# Define the authentication middleware
async def authenticate(request: Request):
    try:
        api_key = request.headers.get('authorization').replace("Bearer ", "")
        cursor.execute("SELECT * FROM voters WHERE voter_id = %s", (api_key,))
        if api_key not in [row[0] for row in cursor.fetchall()]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Forbidden"
            )
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Forbidden"
        )

# Define the POST endpoint for login
@app.get("/login")
async def login(request: Request, voter_id: str, password: str):
    await authenticate(request)
    role = await get_role(voter_id, password)

    # Assuming authentication is successful, generate a token
    token = jwt.encode({'password': password, 'voter_id': voter_id, 'role': role}, os.environ['SECRET_KEY'], algorithm='HS256')

    return {'token': token, 'role': role}

@app.get("/")
async def HI():
    try:
        cursor.execute("INSERT INTO test (id) VALUES (3) ")
        cursor.execute("INSERT INTO test (id) VALUES (4) ")
        
        return {"message": "y"}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

# Replace 'admin' with the actual role based on authentication
async def get_role(voter_id, password):
    try:
        cursor.execute("SELECT role FROM voters WHERE voter_id = %s AND password = %s", (voter_id, password,))
        role = cursor.fetchone()
        if role:
            return role[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid voter id or password"
            )
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )



class Vote_option(BaseModel):
    name:str
    content:str
   

class Vote_INFO(BaseModel):
    title:str
    content:str
    options:List[Vote_option]
    start_time:str
    end_time:str


@app.post("/createVote")
async def create_Vote(info:Vote_INFO):
    try:
        cursor.execute("INSERT INTO vote_info (title, content, start_time, end_time) VALUES (%s, %s, %s, %s) ", (info.title, info.content,info.start_time,info.end_time))
        cursor.execute("SELECT id FROM vote_info WHERE title = %s",   (info.title,) )
        id = cursor.fetchone()
        
        for option in info.options:
            cursor.execute("INSERT INTO vote_option (vote_id, option_title, option_content) VALUES ( %s, %s, %s) ", (id[0], option.name,option.content))

        return {"message": "Vote created successfully"}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

    
@app.get("/getVotes")
async def get_Votes():
    try:
        cursor.execute("SELECT * FROM vote_info" )
        results = cursor.fetchall()
        return { "result":results}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )

@app.get("/getVoteInfo/{id}")
async def get_VoteInfo():
    try:
        cursor.execute("SELECT * FROM vote_info WHERE id = %s",(id,) )
        results = cursor.fetchall()
        return { "result":results}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
        
@app.get("/getVoteOption/{id}")
async def get_Options(id:str):
    try:
        cursor.execute("SELECT * FROM vote_option WHERE vote_id = %s",(id,) )
        results = cursor.fetchall()
        return { "result":results}
    except mysql.connector.Error as err:
        print(err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error"
        )
