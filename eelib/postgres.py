from postgres import Postgres
from eelib.config import load

DB = None

def connect(config=None):
    global DB
    if DB is not None:
        return DB

    if config is None:
        config = load()['postgres']

    url = 'postgresql://{}:{}@{}/{}'.format(
            config['username'],
            config['password'],
            config['host'],
            config['database']
    )

    DB = Postgres(url=url)
    return DB

def get_cursor():
    global DB
    if DB is None:
        raise Exception('no db connection')
    return DB.get_cursor()

def one(query, params=None):
    with get_cursor() as cursor:
        return cursor.one(query, params)

def all(query, params=None):
    with get_cursor() as cursor:
        return cursor.all(query, params)

def run(query, params=None):
    with get_cursor() as cursor:
        return cursor.run(query, params)
