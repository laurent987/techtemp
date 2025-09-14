# TechTemp Device Client - Makefile
# Raspberry Pi AHT20 Sensor + MQTT Client

# Compiler settings
CC = gcc
CFLAGS = -Wall -Wextra -std=c99 -O2
INCLUDES = -Iinclude
LIBS = -lmosquitto -lm

# Simulation mode (for testing without hardware dependencies)
ifeq ($(SIM),1)
    CFLAGS += -DSIMULATION_MODE
    LIBS = -lm
endif

# Cross-compilation for Raspberry Pi (when building on other platforms)
ifeq ($(CROSS),1)
    CC = arm-linux-gnueabihf-gcc
    CFLAGS += -DCROSS_COMPILE
endif

# Directories
SRCDIR = src
INCDIR = include
BUILDDIR = build
CONFIGDIR = config

# Source files
SOURCES = $(wildcard $(SRCDIR)/*.c)
OBJECTS = $(SOURCES:$(SRCDIR)/%.c=$(BUILDDIR)/%.o)
TARGET = $(BUILDDIR)/techtemp-device

# Default target
all: $(TARGET)

# Create build directory if it doesn't exist
$(BUILDDIR):
	mkdir -p $(BUILDDIR)

# Link the final executable
$(TARGET): $(OBJECTS) | $(BUILDDIR)
	$(CC) $(OBJECTS) -o $@ $(LIBS)
	@echo "✅ Build complete: $@"

# Compile source files to object files
$(BUILDDIR)/%.o: $(SRCDIR)/%.c | $(BUILDDIR)
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@
	@echo "🔨 Compiled: $<"

# Install target (copy to /usr/local/bin on Pi)
install: $(TARGET)
	sudo cp $(TARGET) /usr/local/bin/
	sudo cp $(CONFIGDIR)/device.conf /etc/techtemp/
	sudo systemctl daemon-reload
	@echo "✅ Installed to system"

# Clean build artifacts
clean:
	rm -rf $(BUILDDIR)/*
	@echo "🧹 Build directory cleaned"

# Development helpers
dev: CFLAGS += -g -DDEBUG
dev: $(TARGET)

# Check dependencies
check-deps:
	@echo "🔍 Checking dependencies..."
	@which $(CC) > /dev/null || (echo "❌ Compiler $(CC) not found" && exit 1)
	@ldconfig -p | grep -q mosquitto || (echo "⚠️  libmosquitto not found - install with: sudo apt-get install libmosquitto-dev" && exit 1)
	@ldconfig -p | grep -q mosquitto || (echo "⚠️  libmosquitto not found - install with: sudo apt-get install libmosquitto-dev" && exit 1)
	@echo "✅ All dependencies found"

# Show help
help:
	@echo "TechTemp Device Client - Build System"
	@echo ""
	@echo "Targets:"
	@echo "  all        - Build the project (default)"
	@echo "  dev        - Build with debug symbols"
	@echo "  sim        - Build in simulation mode (no hardware deps)"
	@echo "  clean      - Clean build artifacts"
	@echo "  install    - Install to system (requires sudo)"
	@echo "  check-deps - Check if dependencies are installed"
	@echo "  help       - Show this help"
	@echo ""
	@echo "Cross-compilation:"
	@echo "  make CROSS=1 - Cross-compile for Raspberry Pi"
	@echo "  make SIM=1   - Build in simulation mode"

# Simulation build
sim: SIM=1
sim: $(TARGET)

.PHONY: all clean install dev check-deps help sim
