import type { ErrorCase } from '@/types';

// Note: internalId will be added by the HomePage component when initializing state
export const mockErrorCases: Omit<ErrorCase, 'internalId'>[] = [
  {
    champsid: 'CHMPS001',
    text: "The user wants to create a new file. The function `createFile(name)` should be used. Evidence suggests this is a critical operation that needs logging. The system also supports `makeFile(filename)` as an alias.",
    groundtruth_code_list: "def createFile(name):\n  # implementation details\n  log_operation('createFile', name)\n  pass\n\ndef makeFile(filename):\n  # alias implementation\n  createFile(filename)\n  pass",
    llm_predicted_code: "def createFile(name):\n  # implementation details\n  log_operation('createFile', name)\n  pass",
    error_type: 'Incomplete Answer',
    llmAnswer: "To create a new file, you should use the `createFile(name)` function. This function logs the operation.",
  },
  {
    champsid: 'CHMPS002',
    text: "System status can be checked using `getSystemStatus()`. It returns 'OK', 'WARN', or 'ERROR'. The documentation also mentions a function `check_status()` which is deprecated.",
    groundtruth_code_list: "def getSystemStatus():\n  # logic to determine status\n  return 'OK'\n\n# def check_status(): DEPRECATED",
    llm_predicted_code: "def getSystemStatus():\n  # logic to determine status\n  return 'OK'",
    error_type: 'Omission',
    llmAnswer: "You can check the system status using `getSystemStatus()`. It returns 'OK', 'WARN', or 'ERROR'.",
  },
  {
    champsid: 'CHMPS003',
    text: "To update a user profile, call `updateUserProfile(userId, data)`. The `data` parameter must be a dictionary. Invalid data will raise a `ValueError`. If the user is not found, it will raise a `UserNotFoundException`.",
    groundtruth_code_list: "class UserNotFoundException(Exception):\n  pass\n\ndef updateUserProfile(userId, data):\n  if not isinstance(data, dict):\n    raise ValueError('Data must be a dictionary')\n  # ... update logic ...\n  if not user_exists(userId):\n     raise UserNotFoundException(f'User {userId} not found')",
    llm_predicted_code: "def updateUserProfile(userId, data):\n  if not isinstance(data, dict):\n    raise ValueError('Data must be a dictionary')\n  # ... update logic ...",
    error_type: 'Incomplete Answer',
    llmAnswer: "The `updateUserProfile(userId, data)` function updates a user's profile. Ensure `data` is a dictionary, otherwise a `ValueError` is raised.",
  },
  {
    champsid: 'CHMPS004',
    text: "The configuration file is typically located at `/etc/app/config.json`. It contains `timeout` and `retry_count` settings. The default timeout is 30 seconds.",
    groundtruth_code_list: "{\n  \"timeout\": 30,\n  \"retry_count\": 3\n}",
    llm_predicted_code: "{\n  \"timeout\": 60,\n  \"retry_count\": 3\n}", // Example where LLM might be wrong
    error_type: 'Factual Inaccuracy',
    llmAnswer: "The configuration file at `/etc/app/config.json` includes settings for `timeout` and `retry_count`. The default timeout is 60 seconds.",
  },
  {
    champsid: 'CHMPS005',
    text: "This component processes images. Supported formats are JPEG and PNG. The function `processImage(filePath)` returns metadata. For HEIC files, it uses a conversion library first.",
    groundtruth_code_list: "def processImage(filePath):\n  ext = filePath.split('.')[-1].lower()\n  if ext == 'heic':\n    # convert_heic_to_png(filePath)\n    # Placeholder for conversion\n    filePath = filePath.replace('.heic', '.png') # Simulate conversion\n  # process jpeg/png\n  return {'format': ext if ext != 'heic' else 'png'}",
    llm_predicted_code: "def processImage(filePath):\n  ext = filePath.split('.')[-1].lower()\n  # process jpeg/png\n  return {'format': ext}",
    error_type: 'Misinterpretation',
    llmAnswer: "The `processImage(filePath)` function processes images in JPEG and PNG formats and returns their metadata.",
  }
];
