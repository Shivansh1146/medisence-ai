"""
Severity Classifier - Determines medical urgency level (1-4)
"""

import re


class SeverityClassifier:
    def __init__(self):
        # Severity level indicators
        self.level_indicators = {
            1: [  # Mild
                "mild",
                "slight",
                "little",
                "minor",
                "common cold",
                "headache",
                "runny nose",
                "seasonal",
                "allergy",
            ],
            2: [  # Moderate
                "moderate",
                "persistent",
                "worsening",
                "fever",
                "cough",
                "infection",
                "weakness",
                "vomiting",
                "diarrhea",
                "rash",
            ],
            3: [  # Serious
                "severe",
                "chronic",
                "long-term",
                "persistent",
                "cancer",
                "tumor",
                "blood",
                "vomit blood",
                "night pain",
                "unexplained weight loss",
                "difficulty breathing",
                "chest pain",
                "can't breathe",
                "cannot breathe properly",
                "breathing difficulty",
                "severe chest pain",
                "extreme pain",
                "extreme chest pain",
                "pain in chest",
            ],
            4: [  # Emergency
                "emergency",
                "urgent",
                "immediate",
                "unconscious",
                "bleeding heavily",
                "snake bite",
                "accident",
                "broken bone",
                "fracture",
                "burn",
                "heart attack",
                "stroke",
                "cannot breathe",
                "choking",
            ],
        }

        # Time indicators for severity
        self.time_indicators = {
            "minutes": 4,
            "hours": 3,
            "days": 2,
            "weeks": 2,
            "months": 3,
            "years": 3,
        }

    def classify(self, text, symptoms):
        """
        Classify severity level from 1-4
        """
        text_lower = text.lower()

        # Check for emergency keywords first
        for keyword in self.level_indicators[4]:
            if keyword in text_lower:
                return 4

        # Check for serious keywords
        for keyword in self.level_indicators[3]:
            if keyword in text_lower:
                return 3

        # Check for moderate keywords
        for keyword in self.level_indicators[2]:
            if keyword in text_lower:
                return 2

        # Check time indicators
        time_severity = self.analyze_time_urgency(text_lower)
        if time_severity > 1:
            return min(4, max(2, time_severity))

        # Default to mild
        return 1

    def analyze_time_urgency(self, text):
        """
        Analyze time references for urgency
        """
        time_patterns = [
            (r"(\d+)\s*minutes?", "minutes"),
            (r"(\d+)\s*hours?", "hours"),
            (r"(\d+)\s*days?", "days"),
            (r"(\d+)\s*weeks?", "weeks"),
            (r"(\d+)\s*months?", "months"),
            (r"(\d+)\s*years?", "years"),
        ]

        max_urgency = 1
        for pattern, unit in time_patterns:
            matches = re.findall(pattern, text)
            if matches:
                for match in matches:
                    duration = int(match)
                    base_urgency = self.time_indicators.get(unit, 1)

                    # Adjust based on duration
                    if unit == "minutes" and duration < 30:
                        urgency = 4  # Very recent = more urgent
                    elif unit == "hours" and duration < 6:
                        urgency = 3
                    elif unit == "days" and duration < 3:
                        urgency = 2
                    else:
                        urgency = base_urgency

                    max_urgency = max(max_urgency, urgency)

        return max_urgency
