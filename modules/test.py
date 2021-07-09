import time
import eelib.job as job

"""
example
{
   "scriptName" : "test.py",
   "scriptArgs": {
        "intervals": 10
    }
}
"""


@job.parse_arguments('modules/test-args.json')
def main(arguments):
    print('run test.py with {} intervals'.format(arguments["intervals"]))

    # test async stuff from node
    for i in range(0, arguments["intervals"]):
        time.sleep(1)
        print(i)

    print('done')


main()
