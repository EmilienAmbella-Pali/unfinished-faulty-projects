import numpy as np
import pygame
import sys
import math

# Color Definitions
BLUE = (0, 0, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
YELLOW = (255, 255, 0)

# Board Dimensions
ROW_COUNT = 6
COLUMN_COUNT = 7

# Create an empty game board
def create_board():
    return np.zeros((ROW_COUNT, COLUMN_COUNT))

# Drop a game piece in the specified column
def drop_piece(board, row, col, piece):
    board[row][col] = piece

# Check if a location is a valid move
def is_valid_location(board, col):
    return board[ROW_COUNT - 1][col] == 0

# Find the next available row for a piece in the specified column
def get_next_open_row(board, col):
    for r in range(ROW_COUNT):
        if board[r][col] == 0:
            return r

# Print the game board
def print_board(board):
    print(np.flip(board, 0))

# Check for a winning move
def winning_move(board, piece):
    # Check horizontal, vertical, and diagonal wins
    for c in range(COLUMN_COUNT - 3):
        for r in range(ROW_COUNT):
            if all(board[r][c + i] == piece for i in range(4)):
                return True

    for c in range(COLUMN_COUNT):
        for r in range(ROW_COUNT - 3):
            if all(board[r + i][c] == piece for i in range(4)):
                return True

    for c in range(COLUMN_COUNT - 3):
        for r in range(ROW_COUNT - 3):
            if all(board[r + i][c + i] == piece for i in range(4)):
                return True

    for c in range(COLUMN_COUNT - 3):
        for r in range(3, ROW_COUNT):
            if all(board[r - i][c + i] == piece for i in range(4)):
                return True

    return False

# Initialize Pygame
pygame.init()

# Constants
SQUARESIZE = 100
width = COLUMN_COUNT * SQUARESIZE
height = (ROW_COUNT + 1) * SQUARESIZE
RADIUS = int(SQUARESIZE / 2 - 5)

# Create the game window
size = (width, height)
screen = pygame.display.set_mode(size)

# Initialize the font
myfont = pygame.font.SysFont('monospace', 75)

# Draw the game board
def draw_board(board):
    for c in range(COLUMN_COUNT):
        for r in range(ROW_COUNT):
            pygame.draw.rect(screen, BLUE, (c * SQUARESIZE, r * SQUARESIZE + SQUARESIZE, SQUARESIZE, SQUARESIZE))
            pygame.draw.circle(screen, BLACK, (int(c * SQUARESIZE + SQUARESIZE / 2), int(r * SQUARESIZE + SQUARESIZE + SQUARESIZE / 2)), RADIUS)

    for c in range(COLUMN_COUNT):
        for r in range(ROW_COUNT):
            if board[r][c] == 1:
                pygame.draw.circle(screen, RED, (int(c * SQUARESIZE + SQUARESIZE / 2), height - int(r * SQUARESIZE + SQUARESIZE / 2)), RADIUS)
            elif board[r][c] == 2:
                pygame.draw.circle(screen, YELLOW, (int(c * SQUARESIZE + SQUARESIZE / 2), height - int(r * SQUARESIZE + SQUARESIZE / 2)), RADIUS)

    pygame.display.update()

# Game loop function
def game_loop():
    board = create_board()
    print_board(board)
    draw_board(board)

    game_over = False
    turn = 0

    while not game_over:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                sys.exit()

            if event.type == pygame.MOUSEMOTION:
                pygame.draw.rect(screen, BLACK, (0, 0, width, SQUARESIZE))
                posx = event.pos[0]
                pygame.draw.circle(screen, RED if turn == 0 else YELLOW, (posx, int(SQUARESIZE / 2)), RADIUS)
                pygame.display.update()

            if event.type == pygame.MOUSEBUTTONDOWN:
                pygame.draw.rect(screen, BLACK, (0, 0, width, SQUARESIZE))
                posx = event.pos[0]
                col = int(math.floor(posx / SQUARESIZE))

                if is_valid_location(board, col):
                    row = get_next_open_row(board, col)
                    drop_piece(board, row, col, turn + 1)

                    if winning_move(board, turn + 1):
                        color = RED if turn == 0 else YELLOW
                        label = myfont.render(f'Player {turn + 1} wins!!', 1, color)
                        screen.blit(label, (40, 10))
                        pygame.display.update()
                        pygame.time.wait(3000)
                        return  # Restart the game

                    print_board(board)
                    draw_board(board)

                    turn = (turn + 1) % 2  # Switch turns

# Run the game
while True:
    game_loop()
