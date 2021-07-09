CREATE TABLE IF NOT EXISTS cameras_used_in_multicapture_stream (
  camera_id INTEGER REFERENCES camera(id),
  multicapture_stream_id INTEGER REFERENCES multicapture_stream(id),
  unique(camera_id, multicapture_stream_id)
);

INSERT INTO cameras_used_in_multicapture_stream (camera_id, multicapture_stream_id)
(
  SELECT camera.id, subquery.multi_id
  FROM camera
  JOIN (
    SELECT
      json_array_elements(job_script_payload::json->'args')::json->>'stream' as stream_argument,
      multicapture_stream.id as multi_id
    FROM multicapture_stream
    JOIN jobs ON multicapture_stream.running_job_id = jobs.id
  ) as subquery ON subquery.stream_argument = camera.stream_url
) ON CONFLICT DO NOTHING;
