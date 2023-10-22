import cv2
from pyzbar.pyzbar import decode
import time

cam = cv2.VideoCapture(0)
cam.set (5, 640)
cam.set (6, 480)

camera = True
while camera == True:
    suceess, frame = cam.read()

    for i in decode (frame):
        print(i.type)
        print(i.daya.decode('utf-8'))
        timme.sleep(6)

        cv2.imshow('OurQr_Code_Scanner', frame)
        vv2.waitkey(3)