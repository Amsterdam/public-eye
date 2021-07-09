import sys
import eelib.job as job
import eelib.store as store

# example
# {
#   "scriptName" : "ingest_video_file.py",
#   "scriptArgs": {
#     "video_file_path": "/home/ubuntu/eagle_eye/files/videos/bijlmer_experiment/20180101_140821A.mp4"
#    }
# }

def main():
    job_args = job.get_job_args()
    if not job_args:
        print('no job arguments found')
        sys.exit(1)

    if not 'video_file_path' in job_args:
        print('missing video_file_path')
        sys.exit(1)

    vfp = job_args['video_file_path']

    print('try to insert {}'.format(vfp))

    inserted = store.insert_video_file_if_not_exists(vfp)
    if inserted is False:
        print("- Video already inserted")
        sys.exit(1)
    else:
        print("- Done")

main()
