import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jose import jwt
from passlib.context import CryptContext
from fastapi import HTTPException
from core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_verification_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24) 
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def send_verification_email(email: str, token: str):
    """
    Sends a verification email to the user with a link to verify their account.

    Args:
        email (str): The email address of the user.
        token (str): The verification token generated for the user.

    Raises:
        HTTPException: If there is an error while sending the email.
                      - 500 Internal Server Error: Failed to send verification email.
    """
     
    verification_url = f"https://e367-129-224-201-178.ngrok-free.app/auth/verify?token={token}"
    
    msg = MIMEMultipart()
    msg["From"] = "KeyMap Team <kelvingbolo98@gmail.com>"
    msg["To"] = email
    msg["Subject"] = "Verify Your Account for KeyMap"
    msg["Reply-To"] = "kelvingbolo98@gmail.com"

    html_content = f"""
        <p>Hello,</p>
        <p>Thank you for signing up for KeyMap! Please click the link below to verify your account:</p>
        <p><a 
        href="{verification_url}"
        style="
            display: inline-block;
            padding: 10px 20px;
            background-color: #1CB5E0;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            transition: background-color 0.3s ease;
        "
        >Verify Email</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The KeyMap Team</p>
    """
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("kelvingbolo98@gmail.com", "rjrt rgur viec sska")
            server.sendmail("kelvingbolo98@gmail.com", [email], msg.as_string())
        print(f"Verification email sent to {email}")
    except smtplib.SMTPException as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email")