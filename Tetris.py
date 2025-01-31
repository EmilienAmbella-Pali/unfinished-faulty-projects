import pygame
from copy import deepcopy
from random import choice, randrange

# Game settings
W, H = 10, 20
TILE = 45
GAME_RES = W * TILE, H * TILE
FPS = 60

# Initialise pygame
pygame.init()
game_sc = pygame.display.set_mode(GAME_RES)
clock = pygame.time.Clock()

# Define the grid
grid = [pygame.Rect(x * TILE, y * TILE, TILE, TILE) for x in range(W) for y in range(H)]

# Define the shapes of the figures
figures_pos = [
    [(-1, 0), (-2, 0), (0, 0), (1, 0)],               # T-shape
    [(0, -1), (-1, -1), (-1, 0), (0, 0)],              # S-shape
    [(-1, 0), (-1, 1), (0, 0), (0, -1)],               # Z-shape
    [(0, 0), (-1, 0), (0, 1), (-1, -1)],               # L-shape
    [(0, 0), (0, -1), (0, 1), (-1, -1)],               # J-shape
    [(0, 0), (0, -1), (0, 1), (1, -1)],                # Reverse L-shape
    [(0, 0), (0, -1), (0, 1), (-1, 0)]                 # Reverse J-shape
]

# Create figures
figures = [[pygame.Rect(x + W // 2, y + 1, 1, 1) for x, y in fig_pos] for fig_pos in figures_pos]

# Field (game board)
field = [[0 for i in range(W)] for j in range(H)] 

# Animation settings
anim_count, anim_speed, anim_limit = 0, 60, 2000

# Select a random starting figure
figure = deepcopy(choice(figures)) 
figure_rect = pygame.Rect(0, 0, TILE - 2, TILE - 2)

# Function to get a random color
def get_color():
    return (randrange(30, 256), randrange(30, 256), randrange(30, 256))

color = get_color()

# Function to check if the figure is within bounds
def check_boarders():
    for i in range(4):
        if figure[i].x < 0 or figure[i].x > W - 1 or figure[i].y > H - 1 or field[figure[i].y][figure[i].x]:
            return False
    return True

# Function to clear full rows and shift all rows above down
def clear_lines():
    global field
    for row in range(H - 1, -1, -1):
        if all(field[row]):  # If the row is completely filled
            # Shift all rows above the current one down by one
            for y in range(row, 0, -1):
                for x in range(W):
                    field[y][x] = field[y - 1][x]
            # Clear the current row
            field[0] = [0] * W

# Main game loop
while True:
    dx, rotate = 0, False
    game_sc.fill(pygame.Color('black'))

    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            exit()
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_LEFT:
                dx = -1
            elif event.key == pygame.K_RIGHT:
                dx = 1
            elif event.key == pygame.K_DOWN:
                anim_limit = 100
            elif event.key == pygame.K_UP:
                rotate = True

    figure_old = deepcopy(figure)

    # Move the figure
    for i in range(4):
        figure[i].x += dx

    # Check if the figure can move in that direction
    if not check_boarders():
        figure = deepcopy(figure_old)

    anim_count += anim_speed

    # If enough time has passed, move the figure down
    if anim_count > anim_limit:
        anim_count = 0
        figure_old = deepcopy(figure)

        for i in range(4):
            figure[i].y += 1

        if not check_boarders():
            for i in range(4):
                field[figure_old[i].y][figure_old[i].x] = color
            color = get_color()
            figure = deepcopy(choice(figures))
            anim_limit = 2000

    center = figure[0]
    figure_old = deepcopy(figure)

    # Rotate the figure if needed
    if rotate:
        for i in range(4):
            x = figure[i].y - center.y
            y = figure[i].x - center.x
            figure[i].x = center.x - x
            figure[i].y = center.y + y
        if not check_boarders():
            figure = deepcopy(figure_old)

    # Clear full lines
    clear_lines()

    # Check for game over (if any block reaches the top row)
    if any(field[0][i] for i in range(W)):
        print("Game Over!")
        pygame.quit()
        exit()

    # Draw everything
    [pygame.draw.rect(game_sc, (40, 40, 40), i_rect, 1) for i_rect in grid]

    for i in range(4):
        figure_rect.x = figure[i].x * TILE
        figure_rect.y = figure[i].y * TILE
        pygame.draw.rect(game_sc, color, figure_rect)

    for y, row in enumerate(field):
        for x, col in enumerate(row):
            if col:
                figure_rect.x, figure_rect.y = x * TILE, y * TILE
                pygame.draw.rect(game_sc, col, figure_rect)

    pygame.display.flip()
    clock.tick(FPS)
