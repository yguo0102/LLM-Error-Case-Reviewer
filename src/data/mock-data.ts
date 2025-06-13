import type { ErrorCase } from '@/types';

// Note: internalId will be added by the HomePage component when initializing state
export const mockErrorCases: Omit<ErrorCase, 'internalId'>[] = [
  {
    champsid: 'CHMPS001',
    text: "The user wants to create a new file. The function `createFile(name)` should be used. Evidence suggests this is a critical operation that needs logging. The system also supports `makeFile(filename)` as an alias.",
    code: "def createFile(name):\n  # implementation details\n  log_operation('createFile', name)\n  pass",
    code_description: "Creates a new file with the given name and logs the operation.",
    diagnosis: "LLM missed the alias `makeFile` mentioned in the text.",
    error_type: 'Incomplete Answer',
    llmAnswer: "To create a new file, you should use the `createFile(name)` function. This function logs the operation.",
    evidence: ["`createFile(name)` should be used", "critical operation that needs logging"],
  },
  {
    champsid: 'CHMPS002',
    text: "System status can be checked using `getSystemStatus()`. It returns 'OK', 'WARN', or 'ERROR'. The documentation also mentions a function `check_status()` which is deprecated.",
    code: "def getSystemStatus():\n  # logic to determine status\n  return 'OK'",
    code_description: "Returns the current system status, which can be 'OK', 'WARN', or 'ERROR'.",
    diagnosis: "LLM correctly identified `getSystemStatus()` but failed to mention that `check_status()` is deprecated.",
    error_type: 'Omission',
    llmAnswer: "You can check the system status using `getSystemStatus()`. It returns 'OK', 'WARN', or 'ERROR'.",
    evidence: ["System status can be checked using `getSystemStatus()`", "returns 'OK', 'WARN', or 'ERROR'"],
  },
  {
    champsid: 'CHMPS003',
    text: "To update a user profile, call `updateUserProfile(userId, data)`. The `data` parameter must be a dictionary. Invalid data will raise a `ValueError`. If the user is not found, it will raise a `UserNotFoundException`.",
    code: "class UserNotFoundException(Exception):\n  pass\n\ndef updateUserProfile(userId, data):\n  if not isinstance(data, dict):\n    raise ValueError('Data must be a dictionary')\n  # ... update logic ...\n  if not user_exists(userId):\n     raise UserNotFoundException(f'User {userId} not found')",
    code_description: "Updates user profile. Requires data as dict. Raises ValueError for invalid data, UserNotFoundException if user doesn't exist.",
    diagnosis: "LLM mentioned `ValueError` but missed `UserNotFoundException`.",
    error_type: 'Incomplete Answer',
    llmAnswer: "The `updateUserProfile(userId, data)` function updates a user's profile. Ensure `data` is a dictionary, otherwise a `ValueError` is raised.",
    evidence: ["`updateUserProfile(userId, data)`", "Data must be a dictionary", "Invalid data will raise a `ValueError`"],
  },
  {
    champsid: 'CHMPS004',
    text: "The configuration file is typically located at `/etc/app/config.json`. It contains `timeout` and `retry_count` settings. The default timeout is 30 seconds.",
    code: "{\n  \"timeout\": 30,\n  \"retry_count\": 3\n}",
    code_description: "JSON configuration with timeout and retry_count.",
    diagnosis: "LLM incorrectly stated the default timeout is 60 seconds.",
    error_type: 'Factual Inaccuracy',
    llmAnswer: "The configuration file at `/etc/app/config.json` includes settings for `timeout` and `retry_count`. The default timeout is 60 seconds.",
    evidence: ["The default timeout is 30 seconds"],
  },
  {
    champsid: 'CHMPS005',
    text: "This component processes images. Supported formats are JPEG and PNG. The function `processImage(filePath)` returns metadata. For HEIC files, it uses a conversion library first.",
    code: "def processImage(filePath):\n  ext = filePath.split('.')[-1].lower()\n  if ext == 'heic':\n    # convert_heic_to_png(filePath)\n    pass # Placeholder for conversion\n  # process jpeg/png\n  return {'format': ext}",
    code_description: "Processes JPEG or PNG images. HEIC files are converted before processing.",
    diagnosis: "LLM focused on JPEG/PNG and missed the HEIC conversion step mentioned as part of the processing.",
    error_type: 'Misinterpretation',
    llmAnswer: "The `processImage(filePath)` function processes images in JPEG and PNG formats and returns their metadata.",
    evidence: ["Supported formats are JPEG and PNG", "For HEIC files, it uses a conversion library first"],
  }
];
