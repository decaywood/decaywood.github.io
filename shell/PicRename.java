import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.channels.FileChannel;
import java.util.Arrays;
import java.util.concurrent.atomic.LongAdder;

/**
 * @author: decaywood
 * @date: 2016/1/16 9:23.
 */
public class PicRename {

    private static final LongAdder longAdder = new LongAdder();

    private static long increament() {
        longAdder.increment();
        return longAdder.intValue();
    }

    private static void reset() {
        longAdder.reset();
    }

    private synchronized static void nioTransferCopy(File source, File target) {
        try (FileInputStream inStream = new FileInputStream(source);
             FileOutputStream outStream = new FileOutputStream(target);
             FileChannel in = inStream.getChannel();
             FileChannel out = outStream.getChannel()) {

            in.transferTo(0, in.size(), out);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        String path = PicRename.class.getClassLoader().getResource(".").getPath();
        File file = new File(path);
        String split = File.separator;
        File folder = new File(file.getPath().trim() + split + "changed");
        if(!folder.exists()) folder.mkdir();
        String outputPath = folder.getPath() + split;
        Arrays.stream(file.listFiles())
                .parallel()
                .filter(x -> x.isFile() && x.getName().contains(".jpg"))
                .forEach(x -> nioTransferCopy(x, new File(outputPath + increament() + ".jpg")));
        reset();
    }
}
