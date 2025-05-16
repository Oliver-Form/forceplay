import json

def add_50_to_y_values(obj):
    if isinstance(obj, dict):
        return {k: (v + 1 if k == "x" and isinstance(v, (int, float)) else add_50_to_y_values(v)) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [add_50_to_y_values(elem) for elem in obj]
    else:
        return obj

# Load JSON from file
with open('home.json', 'r') as f:
    data = json.load(f)

# Modify only "y" values
updated_data = add_50_to_y_values(data)

# Save the modified JSON
with open('home.json', 'w') as f:
    json.dump(updated_data, f, indent=4)

print("Updated JSON saved to home.json")
