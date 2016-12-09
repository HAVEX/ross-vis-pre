import csv
import sys

filename = sys.argv[1]

lp_writer = csv.writer(open('ross-stats-rt-lp.csv', 'wb'));
kp_writer = csv.writer(open('ross-stats-rt-kp.csv', 'wb'));
pe_writer = csv.writer(open('ross-stats-rt-pe.csv', 'wb'));

NUM_KP = 256
NUM_LP = 712

with open(filename, 'rb') as csvfile:
    reader = csv.reader(csvfile, delimiter=',', quotechar='|')
    reader.next();
    #row = reader.next()
    for row in reader:
        out_pe = [ row[0], row[1], row[2]] + row[NUM_KP+3:NUM_KP+19] 
        pe_writer.writerow(out_pe)

        for kp in range(0,NUM_KP):
            kp_offset = NUM_KP + 19 + kp * 2
            kp_writer.writerow([str(kp), row[0], row[1], row[2], row[3+kp]] + row[kp_offset:kp_offset+2])
       
        for lp in range(0, NUM_LP):
            lp_offset = NUM_KP + 19 + NUM_KP * 2 + lp * 4
            out_lp = [ str(lp), row[0], row[1], row[2] ] +  row[lp_offset:lp_offset+4] + [row[275 + NUM_KP*2 + NUM_LP*4 + lp]] 
            lp_writer.writerow(out_lp)
