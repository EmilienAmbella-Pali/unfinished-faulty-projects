import numpy as np
import cv2
import numpy as np
from pyzbar.pyzbar import decode

try:
    cam = cv2.VideoCapture(0)
    cam.set(3, 640)  # Set width
    cam.set(4, 480)  # Set height

    detected_codes = set()  # To store detected QR codes

    while True:
        success, frame = cam.read()
        if not success:
            break

        # Decode QR codes in the frame
        for code in decode(frame):
            code_data = code.data.decode('utf-8')
            code_type = code.type

            if code_data not in detected_codes:
                print(f"Type: {code_type}")
                print(f"Data: {code_data}")
                detected_codes.add(code_data)  # Prevent re-detection

            # Draw rectangle around the QR code
            points = code.polygon
            if len(points) == 4:
                pts = [tuple(point) for point in points]
                cv2.polylines(frame, [np.array(pts)], isClosed=True, color=(0, 255, 0), thickness=2)

            # Display the decoded data on the frame
            cv2.putText(frame, code_data, (pts[0][0], pts[0][1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        cv2.imshow('QR Code Scanner', frame)

        # Exit if 'q' is pressed or the window is closed
        if cv2.getWindowProperty('QR Code Scanner', cv2.WND_PROP_VISIBLE) < 1:
            print("Window closed. Exiting...")
            break
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("Exit key pressed. Exiting...")
            break

    cam.release()
    cv2.destroyAllWindows()

except KeyboardInterrupt:
    print("Script interrupted by user.")
finally:
    cam.release()
    cv2.destroyAllWindows()
