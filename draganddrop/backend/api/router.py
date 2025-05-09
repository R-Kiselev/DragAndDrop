from fastapi import APIRouter, UploadFile
from fastapi.responses import JSONResponse

from .exceptions import BadRequestError

files = APIRouter()


@files.post("/upload")
async def upload_files(files: list[UploadFile]):
    result = []
    failed_result = []

    for file in files:
        try:
            filename = file.filename
            content = await file.read()

            entry = {
                "filename": filename,
                "content": content.decode("utf-8"),
            }

            result.append(entry)       
        except UnicodeDecodeError:
            # raise BadRequestError(
            #     detail=f"File {file.filename} is not a valid UTF-8 encoded text file."
            # )
            if not file.filename.endswith(".pyc") and not file.filename.endswith(".pyo"):
                failed_result.append(
                    {
                        "filename": file.filename,
                        "content": "File is not a valid UTF-8 encoded text file.\
                            Will add this functionality later.",
                    }
                )
        except RuntimeError:
            raise BadRequestError(
                detail=f"File {file.filename} is too large to process."
            )
        except ValueError:
            raise BadRequestError(
                detail=f"File {file.filename} is not a valid text file."
            )
        except TypeError:
            raise BadRequestError(
                detail=f"File {file.filename} is not a valid text file."
            )
        except Exception as e:
            raise BadRequestError(
                detail=f"Failed to process file {file.filename}: {str(e)}"
            )
    
    result.extend(failed_result)
    response = JSONResponse(
        content={"files": result},
        status_code=200,
    )

    return response
