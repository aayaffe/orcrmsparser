import math

year = 2022
L1_dist_interval = 0.1  # Distance interval expressed in length of first leg to be calculated. in Nautical Miles
L1_min_dist = 0.2  # Minimal distance expressed in length of first leg to be calculated. in Nautical Miles
L1_max_dist = 1.5  # Maximum distance expressed in length of first leg to be calculated. in Nautical Miles
selected_boats = {"Bellendaine": "O2", "Blanc Bleu": "O1", "Mermaid of Delaware": "O2", "Hope": "O1", "SLYD": "O1",
                  "Cyclop": "O1", "YOLO": "O2", "Mina": "O2", "Semiramis": "O2", "Oran Almog": "O2",
                  "Tamar": "O2"}  # List of boats and classes to be calculated
classes = {"O1": "fffa73", "O2": "4afff1"}  # List of classes and colors to be expressed (in the worksheet)
target_time = 60  # Target time in minutes
target_time_margin = 10  # Target time plus/minus margin in minutes to highlight in excel
target_time_allowance = 0.1 # The amount in percent (0.1 = 10%) to add to calculated target time.
course_types = {  # List of course types and their definitions express in percentage of first leg (start line to
    # first mark)
    'W1':
        {
            'Beat': 2,
            'Run': 2
        },
    'W2':
        {
            'Beat': 3,
            'Run': 3
        },
    # 'W3':
    #     {
    #         'Beat': 2,
    #         'Run': 2
    #     },
    'T1':
        {
            'Beat': 2,
            'R135': 2 * math.sqrt(2)
        },
    'T2':
        {
            'Beat': 3,
            'R135': 2 * math.sqrt(2),
            'Run': 1
        },

}
