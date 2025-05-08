from fastapi import HTTPException, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


class BaseHTTPError(HTTPException):
    def __init__(self, status_code: int, detail: str = "An error occurred"):
        super().__init__(
            status_code=status_code,
            detail=detail,
        )


class NotFoundError(BaseHTTPError):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class BadRequestError(BaseHTTPError):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


async def base_error_handler(request: Request, exc: BaseHTTPError):
    return JSONResponse(status_code=exc.status_code, content=exc.detail)


async def internal_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=jsonable_encoder({"code": 500, "err": str(exc)}),
    )
