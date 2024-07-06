import pandas as pd

# Load the data
data = pd.read_csv('finalstu - students.csv')

print(data['courseId'].unique())