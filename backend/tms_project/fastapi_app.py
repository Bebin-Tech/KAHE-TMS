from django.db import close_old_connections
from django.http.request import split_domain_port, validate_host
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from .asgi import application as django_app

from django.conf import settings
from fastapi.middleware.cors import CORSMiddleware
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from core.serializers import MyTokenObtainPairSerializer


def check_host(request: Request):
    domain, _ = split_domain_port(request.headers.get('host', ''))
    if not domain or not validate_host(domain, settings.ALLOWED_HOSTS):
        raise HTTPException(status_code=400, detail='Invalid host header.')


app = FastAPI(title='KAHE Task Management API', dependencies=[Depends(check_host)])
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'] if settings.CORS_ALLOW_ALL_ORIGINS else settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=['*'],
    allow_headers=['*'],
)


def token_response(serializer_class, payload):
    close_old_connections()
    try:
        serializer = serializer_class(data=payload)
        serializer.is_valid(raise_exception=True)
        return JSONResponse(serializer.validated_data)
    except TokenError as exc:
        return token_error_response(InvalidToken(str(exc)))
    except APIException as exc:
        return token_error_response(exc)
    finally:
        close_old_connections()


def token_error_response(exc):
    if exc.status_code == 401:
        exc.auth_header = 'Bearer realm="api"'
    response = exception_handler(exc, {})
    return JSONResponse(response.data, status_code=response.status_code, headers=dict(response.items()))


async def read_token_payload(request: Request):
    content_type = request.headers.get('content-type', '').split(';', 1)[0].lower()
    if content_type in {'application/x-www-form-urlencoded', 'multipart/form-data'}:
        async with request.form() as form:
            return dict(form)
    try:
        payload = await request.json()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail='Invalid JSON request body.') from exc
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail='Expected a JSON object.')
    return payload


@app.get('/api/health/')
def health():
    return {'status': 'ok'}


@app.post('/api/login/', include_in_schema=False)
@app.post('/api/token/')
async def login(payload: dict = Depends(read_token_payload)):
    return await run_in_threadpool(token_response, MyTokenObtainPairSerializer, payload)


@app.post('/api/token/refresh/')
async def refresh_token(payload: dict = Depends(read_token_payload)):
    return await run_in_threadpool(token_response, TokenRefreshSerializer, payload)


# Keep the existing API, Django admin, uploads, and SPA paths available.
app.mount('/', django_app)
