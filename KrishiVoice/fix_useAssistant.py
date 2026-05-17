import sys

file_path = '/Users/aman/Desktop/KrishiVoice/KrishiVoice/src/hooks/useAssistant.js'

with open(file_path, 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if line.strip() == 'export { CROP_DATABASE }' and i + 1 < len(lines) and 'Rice: {' in lines[i+1]:
        start_idx = i
        break

if start_idx != -1:
    end_idx = -1
    for i in range(start_idx + 1, len(lines)):
        if lines[i].strip() == 'export { CROP_DATABASE };' or (lines[i].strip() == '};' and i + 2 < len(lines) and 'const CROP_INTENTS' in lines[i+2]):
            end_idx = i
            break
    
    if end_idx != -1:
        new_lines = lines[:start_idx] + ['export { CROP_DATABASE };\n'] + lines[end_idx+1:]
        with open(file_path, 'w') as f:
            f.writelines(new_lines)
        print("Fixed useAssistant.js successfully!")
    else:
        print("Could not find end index.")
else:
    print("Could not find start index.")
