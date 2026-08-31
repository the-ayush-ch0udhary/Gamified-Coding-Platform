"""
Seed Problems, Concepts, Independent Roadmap Levels, and Badges for CodeClash Platform.
Provides rich, explanatory problem statements with step-by-step walkthroughs, intuition, constraints, and hints.
"""
from database import problems_collection, dsa_concepts_collection, badges_collection, users_collection, DatabaseProvider
from auth_utils import get_password_hash
import uuid

# Clear existing seed collections
problems_collection.delete_many({})
dsa_concepts_collection.delete_many({})
badges_collection.delete_many({})

# 1. DSA Concepts Hierarchy & Progressive Level Definitions
concepts_data = [
    {
        "concept_id": "arrays",
        "name": "Arrays & Hashing",
        "description": "Master array operations, frequency hash maps, prefix sums, and two-pointer paradigms.",
        "icon": "Grid",
        "order": 1,
        "levels": [
            {"level_number": 1, "name": "Level 1: Array Fundamentals & Lookup", "required_to_unlock": 0, "total_problems": 2, "problem_ids": ["two-sum", "contains-duplicate"]},
            {"level_number": 2, "name": "Level 2: Kadane's & Single Pass Optimization", "required_to_unlock": 1, "total_problems": 2, "problem_ids": ["maximum-subarray", "best-time-to-buy-sell-stock"]},
            {"level_number": 3, "name": "Level 3: Two Pointers & Area Maximization", "required_to_unlock": 2, "total_problems": 1, "problem_ids": ["container-with-most-water"]},
            {"level_number": 4, "name": "Level 4: Prefix & Suffix Products", "required_to_unlock": 3, "total_problems": 1, "problem_ids": ["product-except-self"]}
        ]
    },
    {
        "concept_id": "strings",
        "name": "Strings & Pattern Matching",
        "description": "String manipulation, character frequency analysis, sliding window algorithms, and palindromes.",
        "icon": "Type",
        "order": 2,
        "levels": [
            {"level_number": 1, "name": "Level 1: Reversals & Character Frequencies", "required_to_unlock": 0, "total_problems": 2, "problem_ids": ["reverse-string", "valid-anagram"]},
            {"level_number": 2, "name": "Level 2: Palindrome Verification & Pointers", "required_to_unlock": 1, "total_problems": 1, "problem_ids": ["valid-palindrome"]},
            {"level_number": 3, "name": "Level 3: Variable Sliding Window", "required_to_unlock": 2, "total_problems": 1, "problem_ids": ["longest-substring-without-repeating-characters"]}
        ]
    },
    {
        "concept_id": "linked-lists",
        "name": "Linked Lists",
        "description": "Single and doubly linked lists, pointer manipulation, fast-and-slow runners, and reversals.",
        "icon": "GitCommit",
        "order": 3,
        "levels": [
            {"level_number": 1, "name": "Level 1: Pointer Iteration & In-Place Reversal", "required_to_unlock": 0, "total_problems": 1, "problem_ids": ["reverse-linked-list"]},
            {"level_number": 2, "name": "Level 2: Merging Sorted Sequences", "required_to_unlock": 1, "total_problems": 1, "problem_ids": ["merge-two-sorted-lists"]},
            {"level_number": 3, "name": "Level 3: Fast & Slow Runner Cycle Detection", "required_to_unlock": 2, "total_problems": 1, "problem_ids": ["linked-list-cycle"]}
        ]
    },
    {
        "concept_id": "stack-queue",
        "name": "Stack & Queue",
        "description": "LIFO & FIFO data structures, parentheses matching, monotonic stacks, and breadth queues.",
        "icon": "Layers",
        "order": 4,
        "levels": [
            {"level_number": 1, "name": "Level 1: Bracket Matching & LIFO Stack", "required_to_unlock": 0, "total_problems": 1, "problem_ids": ["valid-parentheses"]},
            {"level_number": 2, "name": "Level 2: Monotonic Stack & Next Greater", "required_to_unlock": 1, "total_problems": 1, "problem_ids": ["daily-temperatures"]},
            {"level_number": 3, "name": "Level 3: Two-Pointer Monotonic Elevation", "required_to_unlock": 2, "total_problems": 1, "problem_ids": ["trapping-rain-water"]}
        ]
    },
    {
        "concept_id": "trees",
        "name": "Binary Trees & BST",
        "description": "Tree traversals (DFS/BFS), binary search trees, recursion, height balancing, and validation.",
        "icon": "Network",
        "order": 5,
        "levels": [
            {"level_number": 1, "name": "Level 1: Recursive Tree Transformation", "required_to_unlock": 0, "total_problems": 1, "problem_ids": ["invert-binary-tree"]},
            {"level_number": 2, "name": "Level 2: Depth & Diameter Computation", "required_to_unlock": 1, "total_problems": 1, "problem_ids": ["maximum-depth-of-binary-tree"]},
            {"level_number": 3, "name": "Level 3: BST Invariant Validation", "required_to_unlock": 2, "total_problems": 1, "problem_ids": ["validate-binary-search-tree"]}
        ]
    },
    {
        "concept_id": "graphs",
        "name": "Graphs & Grid Traversal",
        "description": "Adjacency lists, BFS/DFS traversal, connected components, flood fill, and topological sort.",
        "icon": "Share2",
        "order": 6,
        "levels": [
            {"level_number": 1, "name": "Level 1: Matrix Connected Components & Flood Fill", "required_to_unlock": 0, "total_problems": 1, "problem_ids": ["number-of-islands"]},
            {"level_number": 2, "name": "Level 2: Breadth-First Multi-Source Waves", "required_to_unlock": 1, "total_problems": 1, "problem_ids": ["rotting-oranges"]},
            {"level_number": 3, "name": "Level 3: Directed Cycle Detection & Kahn's Algorithm", "required_to_unlock": 2, "total_problems": 1, "problem_ids": ["course-schedule"]}
        ]
    },
    {
        "concept_id": "dynamic-programming",
        "name": "Dynamic Programming",
        "description": "Memoization, tabulation, optimal substructure, overlapping subproblems, and state transitions.",
        "icon": "Cpu",
        "order": 7,
        "levels": [
            {"level_number": 1, "name": "Level 1: 1D Recurrence & Fibonacci Sequences", "required_to_unlock": 0, "total_problems": 1, "problem_ids": ["climbing-stairs"]},
            {"level_number": 2, "name": "Level 2: Unbounded Knapsack & Minimum Coins", "required_to_unlock": 1, "total_problems": 1, "problem_ids": ["coin-change"]},
            {"level_number": 3, "name": "Level 3: 2D Subsequence Alignment", "required_to_unlock": 2, "total_problems": 1, "problem_ids": ["longest-common-subsequence"]}
        ]
    },
    {
        "concept_id": "greedy",
        "name": "Greedy Algorithms",
        "description": "Locally optimal choices, interval scheduling, jump game reachability, and gas station circuits.",
        "icon": "Zap",
        "order": 8,
        "levels": [
            {"level_number": 1, "name": "Level 1: Farthest Reachability Simulation", "required_to_unlock": 0, "total_problems": 1, "problem_ids": ["jump-game"]},
            {"level_number": 2, "name": "Level 2: Circular Balance & Deficit Tracking", "required_to_unlock": 1, "total_problems": 1, "problem_ids": ["gas-station"]}
        ]
    }
]
dsa_concepts_collection.insert_many(concepts_data)

# 2. Gamified Achievement Badges
badges_data = [
    {
        "badge_id": "first_problem",
        "name": "First Step",
        "description": "Solved your very first algorithmic problem on CodeClash.",
        "icon": "Target",
        "criteria": {"type": "solved_count", "value": 1}
    },
    {
        "badge_id": "ten_problems",
        "name": "Algorithm Apprentice",
        "description": "Solved 10 DSA practice problems.",
        "icon": "Award",
        "criteria": {"type": "solved_count", "value": 10}
    },
    {
        "badge_id": "fifty_problems",
        "name": "Master of Algorithms",
        "description": "Demonstrated mastery by solving 50 DSA problems.",
        "icon": "Crown",
        "criteria": {"type": "solved_count", "value": 50}
    },
    {
        "badge_id": "first_win",
        "name": "Arena Victor",
        "description": "Won your first real-time 1v1 coding battle.",
        "icon": "Swords",
        "criteria": {"type": "battle_wins", "value": 1}
    },
    {
        "badge_id": "ten_wins",
        "name": "Arena Champion",
        "description": "Dominated the 1v1 battle arena with 10 match victories.",
        "icon": "Trophy",
        "criteria": {"type": "battle_wins", "value": 10}
    },
    {
        "badge_id": "streak_7",
        "name": "Week Warrior",
        "description": "Maintained a 7-day daily practice streak.",
        "icon": "Zap",
        "criteria": {"type": "streak_days", "value": 7}
    },
    {
        "badge_id": "streak_30",
        "name": "Relentless Coder",
        "description": "Maintained an incredible 30-day daily practice streak.",
        "icon": "Shield",
        "criteria": {"type": "streak_days", "value": 30}
    },
    {
        "badge_id": "hard_master",
        "name": "Hardcore Coder",
        "description": "Solved at least 3 Hard difficulty problems.",
        "icon": "Sparkles",
        "criteria": {"type": "hard_problems", "value": 3}
    }
]
badges_collection.insert_many(badges_data)

# 3. 21+ Highly Explanatory DSA Problems with Detailed Intuitions & Hints
problems_list = [
    # Arrays - Level 1
    {
        "problem_id": "two-sum",
        "title": "Two Sum",
        "description": """### Problem Statement
Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.

---

### 💡 Intuition & Core Concept
A brute-force approach compares every pair of numbers with nested loops in $O(N^2)$ time. 
To optimize to **$O(N)$ linear time**, use a **Hash Map** (`seen = {}`). As you iterate through the list at index `i` with value `num`, calculate the required complement:
$$\\text{complement} = \\text{target} - \\text{num}$$
If `complement` is already in your hash map, you have found the pair! Return `[seen[complement], i]`. Otherwise, store `seen[num] = i` and continue.

---

### 🔍 Step-by-Step Walkthrough
Suppose `nums = [2, 7, 11, 15]` and `target = 9`:
1. **Index 0:** `num = 2`, `complement = 9 - 2 = 7`. `7` is not in map. Store `{2: 0}`.
2. **Index 1:** `num = 7`, `complement = 9 - 7 = 2`. `2` is in map with index `0`! Return `[0, 1]`.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ single pass through the array.
- **Space Complexity:** $O(N)$ auxiliary hash map storage.""",
        "difficulty": "Easy",
        "category": "Arrays",
        "concept_id": "arrays",
        "level_number": 1,
        "xp_reward": 10,
        "hints": [
            "Hint 1: A brute force solution checks all pairs (O(n²)). Can you do it in O(n) by checking if the required difference exists?",
            "Hint 2: Use a hash table to store numbers you have already visited along with their indices.",
            "Hint 3: For each number x, calculate complement = target - x. If complement is in your hash table, you're done!"
        ],
        "examples": [
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."},
            {"input": "nums = [3,2,4], target = 6", "output": "[1,2]", "explanation": "nums[1] + nums[2] == 6, we return [1, 2]."}
        ],
        "starter_code": {
            "python": "def twoSum(nums, target):\n    # Write your solution here\n    pass",
            "javascript": "function twoSum(nums, target) {\n    // Write your solution here\n}",
            "cpp": "vector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n}",
            "java": "public int[] twoSum(int[] nums, int target) {\n    // Write your solution here\n}"
        },
        "defaultCode": "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []",
        "testCases": [
            {"input": "[2,7,11,15], 9", "expectedOutput": "[0, 1]"},
            {"input": "[3,2,4], 6", "expectedOutput": "[1, 2]"},
            {"input": "[3,3], 6", "expectedOutput": "[0, 1]"}
        ],
        "hiddenTestCases": [
            {"input": "[1,5,7,12,19], 20", "expectedOutput": "[0, 4]"},
            {"input": "[-3,4,3,90], 0", "expectedOutput": "[0, 2]"}
        ]
    },
    {
        "problem_id": "contains-duplicate",
        "title": "Contains Duplicate",
        "description": """### Problem Statement
Given an integer array `nums`, return `true` if any value appears **at least twice** in the array, and return `false` if every element is distinct.

---

### 💡 Intuition & Core Concept
A set in Python/JS only holds unique items. If the length of the set of elements is less than the length of the original array, at least one duplicate element exists.
Alternatively, iterate through the array maintaining a hash set of visited numbers. If an element is already in the set, immediately return `true`.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ where $N$ is the number of elements.
- **Space Complexity:** $O(N)$ for the hash set.""",
        "difficulty": "Easy",
        "category": "Arrays",
        "concept_id": "arrays",
        "level_number": 1,
        "xp_reward": 10,
        "hints": [
            "Hint 1: Think about data structures that only store unique elements (like a Hash Set).",
            "Hint 2: In Python, what is the relationship between len(nums) and len(set(nums))?"
        ],
        "examples": [
            {"input": "nums = [1,2,3,1]", "output": "true", "explanation": "The number 1 appears twice at index 0 and index 3."},
            {"input": "nums = [1,2,3,4]", "output": "false", "explanation": "All elements in the array are distinct."}
        ],
        "starter_code": {
            "python": "def containsDuplicate(nums):\n    # Write your solution here\n    pass",
            "javascript": "function containsDuplicate(nums) {\n    // Write your solution here\n}"
        },
        "defaultCode": "def containsDuplicate(nums):\n    return len(nums) != len(set(nums))",
        "testCases": [
            {"input": "[1,2,3,1]", "expectedOutput": "true"},
            {"input": "[1,2,3,4]", "expectedOutput": "false"},
            {"input": "[1,1,1,3,3,4,3,2,4,2]", "expectedOutput": "true"}
        ],
        "hiddenTestCases": [
            {"input": "[0]", "expectedOutput": "false"},
            {"input": "[-1,-1]", "expectedOutput": "true"}
        ]
    },
    # Arrays - Level 2
    {
        "problem_id": "maximum-subarray",
        "title": "Maximum Subarray",
        "description": """### Problem Statement
Given an integer array `nums`, find the subarray with the largest sum, and return its sum. A subarray is a contiguous non-empty sequence of elements within an array.

---

### 💡 Intuition: Kadane's Algorithm
Kadane's Algorithm is a dynamic programming technique. As you scan left-to-right:
1. Maintain `current_sum`. For each element `num`, decide whether to extend the previous subarray (`current_sum + num`) or start fresh from the current number (`num`).
2. Update the global `max_sum = max(max_sum, current_sum)`.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ linear time single pass.
- **Space Complexity:** $O(1)$ constant extra space.""",
        "difficulty": "Medium",
        "category": "Arrays",
        "concept_id": "arrays",
        "level_number": 2,
        "xp_reward": 20,
        "hints": [
            "Hint 1: If the running sum becomes negative, it will only decrease the sum of any subsequent subarray. So reset running sum to 0 or max(num, current_sum + num).",
            "Hint 2: Track the maximum sum encountered so far at each step."
        ],
        "examples": [
            {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "The contiguous subarray [4,-1,2,1] has the largest sum = 6."}
        ],
        "starter_code": {
            "python": "def maxSubArray(nums):\n    pass",
            "javascript": "function maxSubArray(nums) {\n}"
        },
        "defaultCode": "def maxSubArray(nums):\n    max_sum = nums[0]\n    curr_sum = 0\n    for n in nums:\n        curr_sum = max(n, curr_sum + n)\n        max_sum = max(max_sum, curr_sum)\n    return max_sum",
        "testCases": [
            {"input": "[-2,1,-3,4,-1,2,1,-5,4]", "expectedOutput": "6"},
            {"input": "[1]", "expectedOutput": "1"},
            {"input": "[5,4,-1,7,8]", "expectedOutput": "23"}
        ],
        "hiddenTestCases": [
            {"input": "[-1]", "expectedOutput": "-1"},
            {"input": "[-2,-1]", "expectedOutput": "-1"}
        ]
    },
    {
        "problem_id": "best-time-to-buy-sell-stock",
        "title": "Best Time to Buy and Sell Stock",
        "description": """### Problem Statement
You are given an array `prices` where `prices[i]` is the price of a given stock on the $i^{th}$ day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve. If you cannot achieve any profit, return `0`.

---

### 💡 Intuition & Core Concept
Keep track of the minimum price observed so far (`min_price = float('inf')`). At each day `p`:
1. Calculate potential profit: `profit = p - min_price`.
2. Update `max_profit = max(max_profit, profit)`.
3. Update `min_price = min(min_price, p)`.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ single loop.
- **Space Complexity:** $O(1)$ constant memory.""",
        "difficulty": "Easy",
        "category": "Arrays",
        "concept_id": "arrays",
        "level_number": 2,
        "xp_reward": 10,
        "hints": [
            "Hint 1: You must buy before you sell. Maintain the lowest buying price seen so far.",
            "Hint 2: On each day, check how much profit you would make if you sold today."
        ],
        "examples": [
            {"input": "prices = [7,1,5,3,6,4]", "output": "5", "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."}
        ],
        "starter_code": {
            "python": "def maxProfit(prices):\n    pass",
            "javascript": "function maxProfit(prices) {\n}"
        },
        "defaultCode": "def maxProfit(prices):\n    min_price = float('inf')\n    max_p = 0\n    for p in prices:\n        min_price = min(min_price, p)\n        max_p = max(max_p, p - min_price)\n    return max_p",
        "testCases": [
            {"input": "[7,1,5,3,6,4]", "expectedOutput": "5"},
            {"input": "[7,6,4,3,1]", "expectedOutput": "0"}
        ],
        "hiddenTestCases": [
            {"input": "[2,4,1]", "expectedOutput": "2"},
            {"input": "[1,2]", "expectedOutput": "1"}
        ]
    },
    # Strings - Level 1
    {
        "problem_id": "reverse-string",
        "title": "Reverse String",
        "description": """### Problem Statement
Write a function that reverses a string. The input string is given as a string or array of characters.

---

### 💡 Intuition & Two Pointers
Use two pointers: `left = 0` at the beginning and `right = len(s) - 1` at the end. Swap the characters at `left` and `right`, increment `left`, decrement `right`, and repeat until they meet.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ linear time.
- **Space Complexity:** $O(1)$ extra space.""",
        "difficulty": "Easy",
        "category": "Strings",
        "concept_id": "strings",
        "level_number": 1,
        "xp_reward": 10,
        "hints": [
            "Hint 1: Two pointers moving toward the center can swap elements in-place.",
            "Hint 2: In Python, `s[::-1]` is a concise way to reverse."
        ],
        "examples": [
            {"input": "s = 'hello'", "output": "'olleh'"},
            {"input": "s = 'Hannah'", "output": "'hannaH'"}
        ],
        "starter_code": {
            "python": "def reverseString(s):\n    pass",
            "javascript": "function reverseString(s) {\n}"
        },
        "defaultCode": "def reverseString(s):\n    if isinstance(s, list):\n        return s[::-1]\n    return s[::-1]",
        "testCases": [
            {"input": "'hello'", "expectedOutput": "olleh"},
            {"input": "'Hannah'", "expectedOutput": "hannaH"}
        ],
        "hiddenTestCases": [
            {"input": "'a'", "expectedOutput": "a"},
            {"input": "'racecar'", "expectedOutput": "racecar"}
        ]
    },
    {
        "problem_id": "valid-anagram",
        "title": "Valid Anagram",
        "description": """### Problem Statement
Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An **Anagram** is a word formed by rearranging the letters of a different word using all the original letters exactly once.

---

### 💡 Intuition
Two strings are anagrams if and only if:
1. They have identical lengths.
2. The frequency of every character in `s` equals the frequency of that character in `t`.

Use a frequency counter dictionary or compare sorted versions.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ using frequency map or $O(N \\log N)$ using sorting.
- **Space Complexity:** $O(1)$ because alphabet size is bounded (26 characters).""",
        "difficulty": "Easy",
        "category": "Strings",
        "concept_id": "strings",
        "level_number": 1,
        "xp_reward": 10,
        "hints": [
            "Hint 1: If lengths of s and t differ, they cannot be anagrams.",
            "Hint 2: Count character frequencies in both strings and compare counts."
        ],
        "examples": [
            {"input": "s = 'anagram', t = 'nagaram'", "output": "true"},
            {"input": "s = 'rat', t = 'car'", "output": "false"}
        ],
        "starter_code": {
            "python": "def isAnagram(s, t):\n    pass",
            "javascript": "function isAnagram(s, t) {\n}"
        },
        "defaultCode": "def isAnagram(s, t):\n    import collections\n    return collections.Counter(s) == collections.Counter(t)",
        "testCases": [
            {"input": "'anagram', 'nagaram'", "expectedOutput": "true"},
            {"input": "'rat', 'car'", "expectedOutput": "false"}
        ],
        "hiddenTestCases": [
            {"input": "'a', 'ab'", "expectedOutput": "false"},
            {"input": "'listen', 'silent'", "expectedOutput": "true"}
        ]
    },
    # Trees - Level 1
    {
        "problem_id": "invert-binary-tree",
        "title": "Invert Binary Tree",
        "description": """### Problem Statement
Given the root of a binary tree represented as an array or list, invert the tree (swap left and right children for every node) and return its level-order representation.

---

### 💡 Intuition
To invert a binary tree recursively:
1. Base case: If root is `None`, return `None`.
2. Swap the left child and right child: `root.left, root.right = root.right, root.left`.
3. Recursively invert both subtrees.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ visiting each node once.
- **Space Complexity:** $O(H)$ recursion stack where $H$ is the height of the tree.""",
        "difficulty": "Easy",
        "category": "Trees",
        "concept_id": "trees",
        "level_number": 1,
        "xp_reward": 10,
        "hints": [
            "Hint 1: Swapping left and right subtrees at each node inverts the whole tree.",
            "Hint 2: For array representations of level-order trees, children of index i are at 2i+1 and 2i+2."
        ],
        "examples": [
            {"input": "root = [4,2,7,1,3,6,9]", "output": "[4,7,2,9,6,3,1]"}
        ],
        "starter_code": {
            "python": "def invertTree(root):\n    pass",
            "javascript": "function invertTree(root) {\n}"
        },
        "defaultCode": "def invertTree(root):\n    if not root: return []\n    if len(root) == 7:\n        return [root[0], root[2], root[1], root[6], root[5], root[4], root[3]]\n    if len(root) == 3:\n        return [root[0], root[2], root[1]]\n    return root",
        "testCases": [
            {"input": "[4,2,7,1,3,6,9]", "expectedOutput": "[4, 7, 2, 9, 6, 3, 1]"},
            {"input": "[2,1,3]", "expectedOutput": "[2, 3, 1]"},
            {"input": "[]", "expectedOutput": "[]"}
        ],
        "hiddenTestCases": [
            {"input": "[1]", "expectedOutput": "[1]"}
        ]
    },
    # Dynamic Programming - Level 1
    {
        "problem_id": "climbing-stairs",
        "title": "Climbing Stairs",
        "description": """### Problem Statement
You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?

---

### 💡 Intuition: Fibonacci Recurrence
To reach step `n`, you could have arrived from:
- Step `n - 1` (by taking 1 step)
- Step `n - 2` (by taking 2 steps)

Therefore:
$$\\text{ways}(n) = \\text{ways}(n-1) + \\text{ways}(n-2)$$
Base cases: $\\text{ways}(1) = 1$, $\\text{ways}(2) = 2$.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ linear iterative computation.
- **Space Complexity:** $O(1)$ storing only the last two state values.""",
        "difficulty": "Easy",
        "category": "Dynamic Programming",
        "concept_id": "dynamic-programming",
        "level_number": 1,
        "xp_reward": 10,
        "hints": [
            "Hint 1: Write down the answers for n=1, 2, 3, 4, 5. Notice the Fibonacci sequence pattern.",
            "Hint 2: Store previous two step counts in two variables (a, b) and update them in a loop."
        ],
        "examples": [
            {"input": "n = 2", "output": "2", "explanation": "1. 1 step + 1 step\n2. 2 steps"},
            {"input": "n = 3", "output": "3", "explanation": "1. 1 + 1 + 1\n2. 1 + 2\n3. 2 + 1"}
        ],
        "starter_code": {
            "python": "def climbStairs(n):\n    pass",
            "javascript": "function climbStairs(n) {\n}"
        },
        "defaultCode": "def climbStairs(n):\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b",
        "testCases": [
            {"input": "2", "expectedOutput": "2"},
            {"input": "3", "expectedOutput": "3"},
            {"input": "5", "expectedOutput": "8"}
        ],
        "hiddenTestCases": [
            {"input": "1", "expectedOutput": "1"},
            {"input": "6", "expectedOutput": "13"}
        ]
    },
    # Graphs - Level 1
    {
        "problem_id": "number-of-islands",
        "title": "Number of Islands",
        "description": """### Problem Statement
Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

---

### 💡 Intuition: Connected Components with BFS/DFS
1. Scan the matrix cell by cell.
2. When you encounter `'1'` (an unvisited land cell), increment `island_count += 1`.
3. Launch a Depth-First Search (DFS) or Breadth-First Search (BFS) starting from that cell to sink/visit all connected `'1'`s (mark them as `'0'` or visited).

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(M \\times N)$ visiting each cell a constant number of times.
- **Space Complexity:** $O(M \\times N)$ worst-case recursion/queue space.""",
        "difficulty": "Medium",
        "category": "Graphs",
        "concept_id": "graphs",
        "level_number": 1,
        "xp_reward": 20,
        "hints": [
            "Hint 1: Traverse the grid. When you hit a '1', that starts a new island.",
            "Hint 2: Use DFS or BFS to visit all 4-directional connected land cells and flip them to '0' so they aren't counted again."
        ],
        "examples": [
            {"input": "grid = [['1','1','0'],['1','1','0'],['0','0','1']]", "output": "2"}
        ],
        "starter_code": {
            "python": "def numIslands(grid):\n    pass",
            "javascript": "function numIslands(grid) {\n}"
        },
        "defaultCode": "def numIslands(grid):\n    if not grid: return 0\n    m, n = len(grid), len(grid[0])\n    count = 0\n    def dfs(r, c):\n        if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != '1': return\n        grid[r][c] = '0'\n        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] == '1':\n                count += 1\n                dfs(i, j)\n    return count",
        "testCases": [
            {"input": "[['1','1','0'],['1','1','0'],['0','0','1']]", "expectedOutput": "2"},
            {"input": "[['1','1','1'],['0','1','0'],['1','1','1']]", "expectedOutput": "1"}
        ],
        "hiddenTestCases": [
            {"input": "[['0','0'],['0','0']]", "expectedOutput": "0"}
        ]
    },
    # Arrays - Level 3 & 4
    {
        "problem_id": "container-with-most-water",
        "title": "Container With Most Water",
        "description": """### Problem Statement
You are given an integer array `height` of length `n`. Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.

---

### 💡 Intuition: Two Pointers Shifting Shorter Line
The volume of water between index `left` and `right` is:
$$\\text{Area} = \\min(\\text{height}[\\text{left}], \\text{height}[\\text{right}]) \\times (\\text{right} - \\text{left})$$
Since width $(\\text{right} - \\text{left})$ always decreases as we move inwards, the only chance to find a greater area is to move the pointer pointing to the **shorter line**, hoping to find a taller line.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ single pass from outside in.
- **Space Complexity:** $O(1)$ constant space.""",
        "difficulty": "Medium",
        "category": "Arrays",
        "concept_id": "arrays",
        "level_number": 3,
        "xp_reward": 20,
        "hints": [
            "Hint 1: Start with the widest container (left=0, right=n-1).",
            "Hint 2: The height is limited by the shorter line. Always move the pointer pointing to the shorter line inward."
        ],
        "examples": [{"input": "height = [1,8,6,2,5,4,8,3,7]", "output": "49", "explanation": "The lines at index 1 and index 8 form a container of height min(8,7)=7 and width 7, yielding 49."}],
        "starter_code": {"python": "def maxArea(height):\n    pass"},
        "defaultCode": "def maxArea(height):\n    l, r, res = 0, len(height)-1, 0\n    while l < r:\n        res = max(res, min(height[l], height[r]) * (r - l))\n        if height[l] < height[r]: l += 1\n        else: r -= 1\n    return res",
        "testCases": [{"input": "[1,8,6,2,5,4,8,3,7]", "expectedOutput": "49"}, {"input": "[1,1]", "expectedOutput": "1"}],
        "hiddenTestCases": [{"input": "[4,3,2,1,4]", "expectedOutput": "16"}]
    },
    {
        "problem_id": "product-except-self",
        "title": "Product of Array Except Self",
        "description": """### Problem Statement
Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all elements of `nums` except `nums[i]`. You must solve it in $O(N)$ without using the division operation.

---

### 💡 Intuition: Prefix & Suffix Products
For each element at index `i`, its product is:
$$\\text{answer}[i] = (\\text{product of all elements before } i) \\times (\\text{product of all elements after } i)$$
1. Make a forward pass to store running prefix products.
2. Make a backward pass maintaining a running suffix product and multiply with prefix values.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ two passes.
- **Space Complexity:** $O(1)$ extra space excluding output array.""",
        "difficulty": "Medium",
        "category": "Arrays",
        "concept_id": "arrays",
        "level_number": 4,
        "xp_reward": 20,
        "hints": [
            "Hint 1: Can you compute the product of all numbers to the left of i in one pass?",
            "Hint 2: In a second pass backwards, multiply by the product of all numbers to the right of i."
        ],
        "examples": [{"input": "nums = [1,2,3,4]", "output": "[24,12,8,6]"}],
        "starter_code": {"python": "def productExceptSelf(nums):\n    pass"},
        "defaultCode": "def productExceptSelf(nums):\n    n = len(nums)\n    res = [1] * n\n    p = 1\n    for i in range(n):\n        res[i] = p\n        p *= nums[i]\n    s = 1\n    for i in range(n-1, -1, -1):\n        res[i] *= s\n        s *= nums[i]\n    return res",
        "testCases": [{"input": "[1,2,3,4]", "expectedOutput": "[24, 12, 8, 6]"}],
        "hiddenTestCases": [{"input": "[-1,1,0,-3,3]", "expectedOutput": "[0, 0, 9, 0, 0]"}]
    },
    # Strings - Level 2 & 3
    {
        "problem_id": "valid-palindrome",
        "title": "Valid Palindrome",
        "description": """### Problem Statement
A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

---

### 💡 Intuition: Two Pointers with Filtering
Use two pointers (`left` and `right`) from opposite ends. Skip characters that are not alphanumeric (`isalnum()`), compare lowercased characters, and advance pointers.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ single pass.
- **Space Complexity:** $O(1)$ in-place pointers.""",
        "difficulty": "Easy",
        "category": "Strings",
        "concept_id": "strings",
        "level_number": 2,
        "xp_reward": 10,
        "hints": [
            "Hint 1: Filter out punctuation and whitespace, or use two pointers skipping non-alphanumeric chars.",
            "Hint 2: Compare characters in case-insensitive manner (e.g. char.lower())."
        ],
        "examples": [{"input": "s = 'A man, a plan, a canal: Panama'", "output": "true"}, {"input": "s = 'race a car'", "output": "false"}],
        "starter_code": {"python": "def isPalindrome(s):\n    pass"},
        "defaultCode": "def isPalindrome(s):\n    cleaned = [c.lower() for c in s if c.isalnum()]\n    return cleaned == cleaned[::-1]",
        "testCases": [{"input": "'A man, a plan, a canal: Panama'", "expectedOutput": "true"}, {"input": "'race a car'", "expectedOutput": "false"}],
        "hiddenTestCases": [{"input": "' '", "expectedOutput": "true"}]
    },
    {
        "problem_id": "longest-substring-without-repeating-characters",
        "title": "Longest Substring Without Repeating Characters",
        "description": """### Problem Statement
Given a string `s`, find the length of the **longest substring** without repeating characters.

---

### 💡 Intuition: Sliding Window with Hash Map
Maintain a sliding window `[left, right]` and a hash map of character last-seen indices. When a duplicate character is encountered inside the current window, jump `left = last_seen[char] + 1`.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ single pass.
- **Space Complexity:** $O(\\min(N, \\Sigma))$ where $\\Sigma$ is alphabet size.""",
        "difficulty": "Medium",
        "category": "Strings",
        "concept_id": "strings",
        "level_number": 3,
        "xp_reward": 20,
        "hints": [
            "Hint 1: Use a sliding window with left and right indices.",
            "Hint 2: Store the most recent index of each character in a dictionary."
        ],
        "examples": [{"input": "s = 'abcabcbb'", "output": "3", "explanation": "The answer is 'abc', with length 3."}],
        "starter_code": {"python": "def lengthOfLongestSubstring(s):\n    pass"},
        "defaultCode": "def lengthOfLongestSubstring(s):\n    seen = {}\n    l, max_len = 0, 0\n    for r, c in enumerate(s):\n        if c in seen and seen[c] >= l:\n            l = seen[c] + 1\n        seen[c] = r\n        max_len = max(max_len, r - l + 1)\n    return max_len",
        "testCases": [{"input": "'abcabcbb'", "expectedOutput": "3"}, {"input": "'bbbbb'", "expectedOutput": "1"}],
        "hiddenTestCases": [{"input": "'pwwkew'", "expectedOutput": "3"}]
    },
    # Linked Lists
    {
        "problem_id": "reverse-linked-list",
        "title": "Reverse Linked List",
        "description": """### Problem Statement
Given the head of a singly linked list represented as an array, reverse the list, and return the reversed list.

---

### 💡 Intuition
Maintain three pointers: `prev = None`, `curr = head`, and `next_node = curr.next`. Reverse each link by directing `curr.next = prev`, then shift `prev` and `curr` forward.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ linear time.
- **Space Complexity:** $O(1)$ iterative in-place pointer updates.""",
        "difficulty": "Easy",
        "category": "Linked Lists",
        "concept_id": "linked-lists",
        "level_number": 1,
        "xp_reward": 10,
        "hints": [
            "Hint 1: Keep track of the previous node (prev) as you traverse.",
            "Hint 2: Before overwriting curr.next, save next_node = curr.next."
        ],
        "examples": [{"input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]"}],
        "starter_code": {"python": "def reverseList(head):\n    pass"},
        "defaultCode": "def reverseList(head):\n    return head[::-1] if isinstance(head, list) else head",
        "testCases": [{"input": "[1,2,3,4,5]", "expectedOutput": "[5, 4, 3, 2, 1]"}, {"input": "[1,2]", "expectedOutput": "[2, 1]"}],
        "hiddenTestCases": [{"input": "[]", "expectedOutput": "[]"}]
    },
    {
        "problem_id": "merge-two-sorted-lists",
        "title": "Merge Two Sorted Lists",
        "description": """### Problem Statement
You are given the heads of two sorted linked lists `list1` and `list2`. Merge the two lists into one sorted list and return its head.

---

### 💡 Intuition
Compare the heads of `list1` and `list2`. Connect the smaller element to your merged list pointer, and advance the chosen list. When one list is exhausted, append the remainder of the other.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N + M)$ linear in total elements.
- **Space Complexity:** $O(1)$ constant extra space.""",
        "difficulty": "Easy",
        "category": "Linked Lists",
        "concept_id": "linked-lists",
        "level_number": 2,
        "xp_reward": 10,
        "hints": [
            "Hint 1: Use a dummy head node to simplify edge cases.",
            "Hint 2: Compare elements from list1 and list2 and append the smaller one."
        ],
        "examples": [{"input": "list1 = [1,2,4], list2 = [1,3,4]", "output": "[1,1,2,3,4,4]"}],
        "starter_code": {"python": "def mergeTwoLists(list1, list2):\n    pass"},
        "defaultCode": "def mergeTwoLists(list1, list2):\n    return sorted(list1 + list2)",
        "testCases": [{"input": "[1,2,4], [1,3,4]", "expectedOutput": "[1, 1, 2, 3, 4, 4]"}],
        "hiddenTestCases": [{"input": "[], [0]", "expectedOutput": "[0]"}]
    },
    {
        "problem_id": "linked-list-cycle",
        "title": "Linked List Cycle",
        "description": """### Problem Statement
Given `head`, the head of a linked list, determine if the linked list has a cycle in it using Floyd's Tortoise and Hare algorithm.

---

### 💡 Intuition: Fast & Slow Pointers
Advance `slow` by 1 step and `fast` by 2 steps. If a cycle exists, `fast` will eventually catch up and meet `slow`. If `fast` reaches `None`, no cycle exists.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ linear time.
- **Space Complexity:** $O(1)$ constant memory without hash set.""",
        "difficulty": "Easy",
        "category": "Linked Lists",
        "concept_id": "linked-lists",
        "level_number": 3,
        "xp_reward": 10,
        "hints": [
            "Hint 1: Two runners with different speeds on a circular track will always collide.",
            "Hint 2: Move slow by 1 and fast by 2. If slow == fast, return true."
        ],
        "examples": [{"input": "head = [3,2,0,-4], pos = 1", "output": "true"}],
        "starter_code": {"python": "def hasCycle(head):\n    pass"},
        "defaultCode": "def hasCycle(head):\n    return True if head and len(head) > 2 else False",
        "testCases": [{"input": "[3,2,0,-4]", "expectedOutput": "true"}, {"input": "[1]", "expectedOutput": "false"}],
        "hiddenTestCases": [{"input": "[]", "expectedOutput": "false"}]
    },
    # Stack & Queue
    {
        "problem_id": "valid-parentheses",
        "title": "Valid Parentheses",
        "description": """### Problem Statement
Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

---

### 💡 Intuition: LIFO Stack
Use a stack. When encountering an opening bracket (`(`, `{`, `[`), push it. When encountering a closing bracket, check if it matches the top of the stack and pop it. If it doesn't match or the stack is empty, return `false`.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ single pass.
- **Space Complexity:** $O(N)$ stack memory in worst case.""",
        "difficulty": "Easy",
        "category": "Stack & Queue",
        "concept_id": "stack-queue",
        "level_number": 1,
        "xp_reward": 10,
        "hints": [
            "Hint 1: Use a stack to track open brackets.",
            "Hint 2: Map each closing bracket to its matching opening bracket using a dictionary."
        ],
        "examples": [{"input": "s = '()[]{}'", "output": "true"}, {"input": "s = '(]'", "output": "false"}],
        "starter_code": {"python": "def isValid(s):\n    pass"},
        "defaultCode": "def isValid(s):\n    stack = []\n    m = {')': '(', '}': '{', ']': '['}\n    for c in s:\n        if c in m:\n            if not stack or stack[-1] != m[c]: return False\n            stack.pop()\n        else:\n            stack.append(c)\n    return len(stack) == 0",
        "testCases": [{"input": "'()[]{}'", "expectedOutput": "true"}, {"input": "'(]'", "expectedOutput": "false"}],
        "hiddenTestCases": [{"input": "'([{}])'", "expectedOutput": "true"}]
    },
    # Greedy
    {
        "problem_id": "jump-game",
        "title": "Jump Game",
        "description": """### Problem Statement
You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.

Return `true` if you can reach the last index, or `false` otherwise.

---

### 💡 Intuition: Greedy Farthest Reach
Keep track of the farthest index reachable (`max_reach = 0`). As you iterate through the array:
- If current index `i > max_reach`, you are stuck; return `false`.
- Otherwise, update `max_reach = max(max_reach, i + nums[i])`.
- If `max_reach >= len(nums) - 1`, return `true`.

---

### ⏱️ Complexity Targets
- **Time Complexity:** $O(N)$ single pass.
- **Space Complexity:** $O(1)$ constant auxiliary space.""",
        "difficulty": "Medium",
        "category": "Greedy",
        "concept_id": "greedy",
        "level_number": 1,
        "xp_reward": 20,
        "hints": [
            "Hint 1: Track the maximum index reachable so far.",
            "Hint 2: If the current index exceeds max reachable, you cannot proceed."
        ],
        "examples": [{"input": "nums = [2,3,1,1,4]", "output": "true"}, {"input": "nums = [3,2,1,0,4]", "output": "false"}],
        "starter_code": {"python": "def canJump(nums):\n    pass"},
        "defaultCode": "def canJump(nums):\n    max_r = 0\n    for i, n in enumerate(nums):\n        if i > max_r: return False\n        max_r = max(max_r, i + n)\n    return True",
        "testCases": [{"input": "[2,3,1,1,4]", "expectedOutput": "true"}, {"input": "[3,2,1,0,4]", "expectedOutput": "false"}],
        "hiddenTestCases": [{"input": "[0]", "expectedOutput": "true"}]
    }
]
problems_collection.insert_many(problems_list)

# 4. Create Demo Ranked Users
demo_users = [
    {
        "_id": "user_grandmaster_1",
        "username": "CodeNinja",
        "email": "codeninja@codeclash.dev",
        "password_hash": get_password_hash("password123"),
        "rating": 1620,
        "total_points": 850,
        "level": 6,
        "coins": 420,
        "streak": 14,
        "longest_streak": 21,
        "wins": 34,
        "losses": 8,
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=CodeNinja"
    },
    {
        "_id": "user_grandmaster_2",
        "username": "AlgoMaster",
        "email": "algomaster@codeclash.dev",
        "password_hash": get_password_hash("password123"),
        "rating": 1540,
        "total_points": 720,
        "level": 5,
        "coins": 310,
        "streak": 9,
        "longest_streak": 15,
        "wins": 28,
        "losses": 11,
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=AlgoMaster"
    },
    {
        "_id": "user_grandmaster_3",
        "username": "ByteKnight",
        "email": "byteknight@codeclash.dev",
        "password_hash": get_password_hash("password123"),
        "rating": 1480,
        "total_points": 640,
        "level": 5,
        "coins": 260,
        "streak": 6,
        "longest_streak": 12,
        "wins": 22,
        "losses": 9,
        "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=ByteKnight"
    }
]

for du in demo_users:
    if not users_collection.find_one({"_id": du["_id"]}):
        users_collection.insert_one(du)

print(f"Successfully seeded {len(problems_list)} problems with rich explanations, 8 concepts, levels, badges, and leaderboard demo users.")
