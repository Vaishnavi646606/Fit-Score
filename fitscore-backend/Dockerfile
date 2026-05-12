FROM python:3.10

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

# Validate spaCy availability in the image and install the language model.
RUN python -m spacy validate || true
RUN python -m spacy download en_core_web_sm

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]