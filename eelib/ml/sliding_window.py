class SlidingWindow:

    def __init__(self, size = 1):
        self.reset()
        self.size = size

    def reset(self):
        self.values = []

    def update(self, value):
        self.values = (self.values + [value])[-self.size:]

    def get(self):
        return sum(self.values) / len(self.values)
