import sys
import os
import eelib.postgres as pg
import json

g_job = None


def get_array_or_fail(schema, argname):
    """
    important! Required keys cannot have a falsy value like ''
    """
    def unpack(args, key, required, default):
        if not args.get(key) and required:
            print(f'Exiting... Required key: "{key}" not in one of the elements of job argument array.')
            sys.exit(1)

        if key in args and args[key] is None:
            return default

        if key in args:
            return args[key]

        return default

    def unpack_args(args):
        return {key: unpack(args, key, required, default) for (key, required, default) in schema}

    if g_job is None:
        get_job_args()

    if argname not in g_job:
        print('{} is not in job arguments but required'.format(argname))
        sys.exit(1)

    return [unpack_args(args) for args in g_job[argname]]


def get_or_fail(argname):
    if g_job is None:
        get_job_args()

    if argname not in g_job:
        print('{} is not in job arguments but required'.format(argname))
        sys.exit(1)

    return g_job[argname]


def get_or_default(argname, default):
    if g_job is None:
        get_job_args()
    if argname in g_job and g_job[argname] is not None and g_job[argname] != '':
        return g_job[argname]

    return default


def get_job_id():
    return sys.argv[1]


def get_job_args():
    global g_job
    pg.connect()

    job_id = sys.argv[1]

    with pg.get_cursor() as cursor:
        sql = 'SELECT job_script_payload FROM jobs WHERE id=%(id)s'
        data = cursor.one(sql, {'id': job_id})
        if data is not None:
            try:
                g_job = json.loads(data)
                return g_job
            except Exception:
                return None
        return None


def required_check(arg_name, arg_spec, job_args):
    if arg_spec.get('required', False) and arg_name not in job_args:
        print(f"'{arg_name}' is required but not provided")
        sys.exit(1)


def check_instance(arg, arg_type):
    """
    arguments are send via JSON, therefore float values
    that take the value of an int are represented as int in (e.g. 1.0 -> 1)
    therefore float also accepts int values
    """
    if arg_type == float:
        return (
            not isinstance(arg, float) and
            not isinstance(arg, int) and
            arg is not None
        )

    return not isinstance(arg, arg_type) and arg is not None


def type_check(arg_name, arg, arg_spec):
    type_map = {
        "float": float,
        "string": str,
        "int": int,
        "array": list,
        "boolean": bool
    }

    arg_type = type_map.get(arg_spec['type'])
    if arg_type is None:
        print(f"{arg_name} uses unrecognized type: '{arg_spec['type']}'")
        sys.exit(1)

    # argument should of correct type or should be None
    if check_instance(arg, arg_type):
        print(f"'{arg_name}' should be type: {arg_spec['type']}")
        sys.exit(1)

    if arg_type == list:
        shape = arg_spec.get('shape')
        if shape is not None:
            shape_type = type_map.get(shape)
            if shape_type is None:
                print(
                    f"{arg_name} uses unrecognized shape type: '{shape}'")
                sys.exit(1)

            if not all(isinstance(e, shape_type) for e in arg):
                print(
                    f"{arg_name}: every element should be of type: '{shape_type}")


def parse_arguments(argument_file):
    arguments = None
    with open(os.path.join(os.environ['EAGLE_EYE_PATH'], argument_file)) as f:
        arguments = json.load(f)

    job_arguments = get_job_args()
    args = {}

    for arg_name, arg_spec in arguments.items():
        required_check(arg_name, arg_spec, job_arguments)
        arg = get_argument_or_default(arg_name, arg_spec, job_arguments)
        type_check(arg_name, arg, arg_spec)
        args[arg_name] = arg

    def decorator(func):
        return lambda: func(args)

    return decorator


def get_argument_or_default(arg_name, arg_spec, job_args):
    argument = job_args.get(arg_name)
    if argument is None:
        return arg_spec.get('default')
    return argument