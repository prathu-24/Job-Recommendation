from fastapi.testclient import TestClient
from app.main import app
from app.database.session import Base, engine, SessionLocal

client = TestClient(app)

def setup_module(module):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)

def test_register_and_login():
    # Make email unique for testing
    import uuid
    uid = uuid.uuid4().hex[:6]
    test_email = f"test_{uid}@example.com"
    
    # 1. Register candidate
    reg_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Candidate",
            "email": test_email,
            "password": "testpassword123",
            "role": "candidate"
        }
    )
    assert reg_response.status_code == 201
    assert reg_response.json()["email"] == test_email
    
    # 2. Login candidate
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": "testpassword123"
        }
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["role"] == "candidate"
    
    # 3. Retrieve current user info
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_response = client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == test_email
