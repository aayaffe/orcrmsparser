import json
import sys
from pathlib import Path
from tabulate import tabulate
import numpy as np
from scipy.interpolate import interp2d

def read_orc_json(json_file):
    """Read and parse ORC certificate JSON file."""
    with open(json_file, 'r') as f:
        data = json.load(f)
    return data

def print_available_boats(data):
    """Print list of available boats in the certificate file."""
    if not data.get('rms'):
        raise ValueError("No RMS data found in the certificate")
    
    boats = []
    for i, boat in enumerate(data['rms'], 1):
        boats.append([
            i,
            boat.get('YachtName', 'Unknown'),
            boat.get('SailNo', 'Unknown'),
            boat.get('Class', 'Unknown'),
            boat.get('NatAuth', 'Unknown')
        ])
    
    print("\nAvailable boats in the certificate file:")
    print(tabulate(boats, headers=['#', 'Boat Name', 'Sail No', 'Class', 'Nat Auth'], tablefmt='grid'))
    return len(boats)

def extract_polar_data(data, boat_index=0):
    """Extract polar data from ORC certificate for a specific boat."""
    if not data.get('rms'):
        raise ValueError("No RMS data found in the certificate")
    
    if boat_index >= len(data['rms']):
        raise ValueError(f"Boat index {boat_index} is out of range")
    
    rms_data = data['rms'][boat_index]
    allowances = rms_data.get('Allowances')
    if not allowances:
        raise ValueError(f"No polar data found for boat {rms_data.get('YachtName', 'Unknown')}")
    
    # Extract wind speeds and angles
    wind_speeds = allowances['WindSpeeds']
    wind_angles = allowances['WindAngles']
    
    # Calculate average beat angle from certificate
    beat_angles = allowances.get('BeatAngle', [])
    if not beat_angles:
        raise ValueError("No beat angles found in certificate")
    avg_beat_angle = round(sum(beat_angles) / len(beat_angles), 1)  # Round to 1 decimal place
    
    # Extract boat speeds for each angle
    polar_data = {}
    for angle in wind_angles:
        key = f'R{angle}'
        if key in allowances:
            # Convert TOT values to boat speeds (knots)
            tot_values = allowances[key]
            boat_speeds = [3600/tot if tot > 0 else 0 for tot in tot_values]
            polar_data[float(angle)] = boat_speeds
    
    # Get beat speeds from the certificate data
    beat_key = 'Beat'  # Using the standard beat angle from ORC
    print(f"Allowances: {allowances}")
    if beat_key in allowances:
        tot_values = allowances[beat_key]
        beat_speeds = [3600/tot if tot > 0 else 0 for tot in tot_values]
        polar_data[avg_beat_angle] = beat_speeds
    
    return wind_speeds, wind_angles, polar_data, rms_data.get('YachtName', 'Unknown Boat')

def interpolate_polar(wind_speeds, wind_angles, polar_data):
    """Create an interpolation function for the polar data."""
    # Prepare data for interpolation
    angles = np.array(wind_angles)
    speeds = np.array(wind_speeds)
    data = np.zeros((len(angles), len(speeds)))
    
    for i, angle in enumerate(wind_angles):
        if angle in polar_data:
            data[i, :] = polar_data[angle]
    
    # Create interpolation function
    return interp2d(speeds, angles, data, kind='linear')

def calculate_vmg(wind_speed, wind_angle, boat_speed):
    """Calculate VMG for a given wind speed, angle and boat speed."""
    # Convert angle to radians
    angle_rad = np.radians(wind_angle)
    # Calculate VMG (projection of boat speed onto wind direction)
    return boat_speed * np.cos(angle_rad)

def find_optimal_angle(interp_func, wind_speed, angle_range, step=0.1):
    """Find the optimal angle for maximum VMG within the given range."""
    angles = np.arange(angle_range[0], angle_range[1] + step, step)
    max_vmg = -float('inf')
    optimal_angle = None
    optimal_speed = None
    
    for angle in angles:
        speed = float(interp_func(wind_speed, angle)[0])
        vmg = calculate_vmg(wind_speed, angle, speed)
        if vmg > max_vmg:
            max_vmg = vmg
            optimal_angle = angle
            optimal_speed = speed
    
    return optimal_angle, optimal_speed, max_vmg

def calculate_beat_and_run(wind_speeds, wind_angles, polar_data):
    """Calculate beat angles and VMG for upwind and downwind."""
    interp_func = interpolate_polar(wind_speeds, wind_angles, polar_data)
    
    beat_data = []
    run_data = []
    
    for wind_speed in wind_speeds:
        # Find optimal upwind angle (typically between 30-60 degrees)
        beat_angle, beat_speed, beat_vmg = find_optimal_angle(
            interp_func, wind_speed, (30, 60)
        )
        
        # Find optimal downwind angle (typically between 120-180 degrees)
        run_angle, run_speed, run_vmg = find_optimal_angle(
            interp_func, wind_speed, (120, 180)
        )
        
        beat_data.append({
            'wind_speed': wind_speed,
            'angle': beat_angle,
            'speed': beat_speed,
            'vmg': beat_vmg
        })
        
        run_data.append({
            'wind_speed': wind_speed,
            'angle': run_angle,
            'speed': run_speed,
            'vmg': run_vmg
        })
    
    return beat_data, run_data

def print_polar_data(wind_speeds, wind_angles, polar_data, boat_name):
    """Print polar data in a formatted table."""
    # Create header row for polar data
    header = ['TWA/TWS'] + [f"{ws:6.1f}" for ws in wind_speeds]
    
    # Create data rows for polar data
    rows = []
    
    # Get all angles including the average beat angle and sort them
    all_angles = sorted(polar_data.keys())
    print(f"Debug: Printing table with angles: {all_angles}")
    
    # Add all polar data rows
    for angle in all_angles:
        speeds = polar_data[angle]
        if speeds:
            # Format the angle with 1 decimal place
            angle_str = f"{angle:3.1f}°"
            # Format each speed with 2 decimal places
            speed_strs = [f"{s:6.2f}" for s in speeds]
            rows.append([angle_str] + speed_strs)
            print(f"Debug: Added row for angle {angle}° with speeds: {speeds}")
    
    print(f"\nPolar data for {boat_name}:")
    print(tabulate(rows, headers=header, tablefmt='grid'))

def convert_to_pol_format(wind_speeds, wind_angles, polar_data, boat_name):
    """Convert polar data to OpenCPN POL format."""
    # POL file header
    pol_content = [
        f"Boat: {boat_name}",
        "Date: " + datetime.datetime.now().strftime("%Y-%m-%d"),
        "Speed units: kts",
        "Wind speed units: kts",
        "Wind angle units: degrees",
        "TWA/TWS",
    ]
    
    # Add wind speeds as column headers
    pol_content.append(" " + " ".join(f"{ws:6.1f}" for ws in wind_speeds))
    
    # Get all angles including the average beat angle and sort them
    all_angles = sorted(polar_data.keys())
    
    # Add all polar data rows
    for angle in all_angles:
        speeds = polar_data[angle]
        if speeds:
            # Format the angle with 1 decimal place and speeds with 2 decimal places
            row = f"{angle:3.1f} " + " ".join(f"{s:6.2f}" for s in speeds)
            pol_content.append(row)
    
    return "\n".join(pol_content)

def save_pol_file(content, output_file):
    """Save polar data to POL file."""
    with open(output_file, 'w') as f:
        f.write(content)

def main():
    if len(sys.argv) < 2:
        print("Usage: python polars_generator.py <orc_json_file> [boat_index] [output_pol_file]")
        sys.exit(1)
    
    json_file = sys.argv[1]
    if not Path(json_file).exists():
        print(f"Error: File {json_file} not found")
        sys.exit(1)
    
    try:
        # Read the data
        data = read_orc_json(json_file)
        
        # Print available boats
        num_boats = print_available_boats(data)
        
        # Get boat index from command line or ask user
        boat_index = 0
        if len(sys.argv) > 2:
            try:
                boat_index = int(sys.argv[2]) - 1  # Convert to 0-based index
                if boat_index < 0 or boat_index >= num_boats:
                    raise ValueError()
            except ValueError:
                print(f"Error: Invalid boat index. Please choose a number between 1 and {num_boats}")
                sys.exit(1)
        else:
            while True:
                try:
                    choice = input(f"\nEnter boat number (1-{num_boats}) or 'q' to quit: ")
                    if choice.lower() == 'q':
                        sys.exit(0)
                    boat_index = int(choice) - 1
                    if 0 <= boat_index < num_boats:
                        break
                    print(f"Please enter a number between 1 and {num_boats}")
                except ValueError:
                    print("Please enter a valid number")
        
        # Extract and print polar data
        wind_speeds, wind_angles, polar_data, boat_name = extract_polar_data(data, boat_index)
        print_polar_data(wind_speeds, wind_angles, polar_data, boat_name)
        
        # Ask if user wants to save the POL file
        save = input("\nDo you want to save this data as a POL file? (y/n): ").lower()
        if save == 'y':
            # Determine output filename
            if len(sys.argv) > 3:
                output_file = sys.argv[3]
            else:
                output_file = f"{boat_name.replace(' ', '_')}.pol"
            
            # Convert and save
            pol_content = convert_to_pol_format(wind_speeds, wind_angles, polar_data, boat_name)
            save_pol_file(pol_content, output_file)
            print(f"Successfully created polar file: {output_file}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    import datetime  # Import here to avoid circular import
    main()
