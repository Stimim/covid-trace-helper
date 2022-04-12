import json

from google.cloud import vision
from google.cloud import datastore as datastore_module

from datastore import photo as photo_module
from datastore import datastore_helper


_DATASTORE_KEY = 'TextDetectionResult'


class TextAnnotation:
  __slots__ = [
    'description',
    'min_x',
    'max_x',
    'min_y',
    'max_y',
  ]

  def __init__(self, text_annotation):
    self.description = text_annotation.description

    vs = text_annotation.bounding_poly.vertices
    self.min_x = min(v.x for v in vs)
    self.max_x = max(v.x for v in vs)
    self.min_y = min(v.y for v in vs)
    self.max_y = max(v.y for v in vs)

  def ShouldMerge(self, other):
    has_overlap = self.min_y <= other.min_y <= self.max_y
    has_overlap |= other.min_y <= self.min_y <= other.max_y

    if not has_overlap:
      return False
    if self.max_x > other.min_x:
      # My right boundary is in the right of the left boundary of other
      return False
    if self.max_x + 10 < other.min_x:
      # The gap between to boxes is too large
      return False

    return True

  def Merge(self, other):
    self.description += other.description
    self.min_x = min(self.min_x, other.min_x)
    self.max_x = max(self.max_x, other.max_x)
    self.min_y = min(self.min_y, other.min_y)
    self.max_y = max(self.max_y, other.max_y)


def DetectTextTask(checksum: str):
  """Detect text on a photo in a deferred context.

  Args:
    checksum: the checksum of the photo.
    mimetype: the mimetype of the photo.
  """
  try:
    photo = photo_module.Photo.QueryByChecksum(checksum)
  except ValueError:
    return

  client = vision.ImageAnnotatorClient()
  image = vision.Image()
  image.source.image_uri = photo.GetStorageUrl()
  response = client.text_detection(image=image)
  text_annotations = response.text_annotations

  text_results = []
  for text_annotation in text_annotations[1:]:
    x = TextAnnotation(text_annotation)
    text_results.append(x)

    ### Backup: algorithm to reduce data size.
    # if len(text_results) == 0:
      # text_results.append(x)
      # continue

    # if text_results[-1].ShouldMerge(x):
      # text_results[-1].Merge(x)
    # else:
      # text_results.append(x)

  store_client = datastore_helper.Client()
  entity = datastore_module.Entity(store_client.key(_DATASTORE_KEY))
  entity.update({
    'checksum': checksum,
    'result': json.dumps([[x.description, x.min_x, x.max_x, x.min_y, x.max_y]
                          for x in text_results],
                         separators=(',', ':'))})
  entity.exclude_from_indexes.add('result')
  store_client.put(entity)


def QueryTextDetectionResult(checksum: str):
  store_client = datastore_helper.Client()
  query = store_client.query(kind=_DATASTORE_KEY)
  query.add_filter('checksum', '=', checksum)
  results = list(query.fetch())
  if len(results) >= 0:
    o = results[0]['result']
    return json.loads(o)
  raise KeyError(f'Cannot find result for {checksum}, try again later')
